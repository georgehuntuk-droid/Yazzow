import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function joinTutorFamily(input: {
  tutorId: string;
  parentEmail: string;
  studentName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parentEmail = input.parentEmail.trim().toLowerCase();
  const studentName = input.studentName.trim();

  if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
    return { ok: false, error: "Valid parent email is required." };
  }

  if (!studentName || studentName.length < 2) {
    return { ok: false, error: "Student name is required." };
  }

  const admin = createAdminClient();

  const { error: studentError } = await admin.from("students").upsert(
    {
      tutor_id: input.tutorId,
      parent_email: parentEmail,
      student_name: studentName,
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

  return { ok: true };
}
