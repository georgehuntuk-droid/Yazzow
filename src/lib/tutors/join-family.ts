import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendSignupLinkViaResend } from "@/lib/auth/send-auth-email";
import { authConfirmUrl } from "@/lib/auth/redirect-origin";

export async function joinTutorFamily(input: {
  tutorId: string;
  parentEmail: string;
  studentName: string;
  password?: string;
  parentPhone?: string;
  origin?: string;
}): Promise<{ ok: true; needsVerification?: boolean } | { ok: false; error: string }> {
  const parentEmail = input.parentEmail.trim().toLowerCase();
  const studentName = input.studentName.trim();

  if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
    return { ok: false, error: "Valid parent email is required." };
  }

  if (!studentName || studentName.length < 2) {
    return { ok: false, error: "Student name is required." };
  }

  const admin = createAdminClient();

  // Check if they already exist in auth
  let userExists = false;
  try {
    const { data: usersData } = await admin.auth.admin.listUsers();
    if (usersData?.users) {
      userExists = usersData.users.some((u) => u.email?.toLowerCase() === parentEmail);
    }
  } catch {
    // ignore
  }

  let needsVerification = false;

  if (!userExists) {
    if (!input.password || input.password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters to register your parent account." };
    }

    const origin = input.origin || "http://localhost:3000";
    
    // Fetch tutor username for workspace redirect
    const { data: tutorProfile } = await admin
      .from("tutor_profiles")
      .select("username")
      .eq("id", input.tutorId)
      .maybeSingle();

    const tutorUsername = tutorProfile?.username ?? "demo";
    const nextPath = `/tutor/${tutorUsername}/workspace`;
    const confirmUrl = authConfirmUrl(origin, nextPath);

    // SignUp the user
    const { error: signUpError } = await admin.auth.signUp({
      email: parentEmail,
      password: input.password,
      options: {
        emailRedirectTo: confirmUrl,
      },
    });

    if (signUpError) {
      return { ok: false, error: signUpError.message };
    }

    // Try sending custom signup verification email via Resend
    await sendSignupLinkViaResend({
      email: parentEmail,
      password: input.password,
      redirectTo: confirmUrl,
    });

    needsVerification = true;
  }

  const { data: existingStudent } = await admin
    .from("students")
    .select("status")
    .eq("tutor_id", input.tutorId)
    .ilike("parent_email", parentEmail)
    .ilike("student_name", studentName)
    .maybeSingle();

  const status = existingStudent?.status || "pending";

  const { error: studentError } = await admin.from("students").upsert(
    {
      tutor_id: input.tutorId,
      parent_email: parentEmail,
      student_name: studentName,
      status,
      parent_phone: input.parentPhone || null,
    },
    { onConflict: "tutor_id,parent_email,student_name" },
  );

  if (studentError) {
    return { ok: false, error: studentError.message };
  }

  await admin.from("slot_alert_subscribers").upsert(
    {
      tutor_id: input.tutorId,
      parent_email: parentEmail,
      student_name: studentName,
    },
    { onConflict: "tutor_id,parent_email" },
  );

  return { ok: true, needsVerification };
}
