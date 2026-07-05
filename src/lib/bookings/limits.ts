import { createAdminClient } from "@/lib/supabase/admin";
import { getTutorSubscriptionState } from "@/lib/stripe/subscription";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

/**
 * Checks if a tutor has reached their active student limit before a new booking or checkout is permitted.
 * Returns { ok: true } if allowed, or { ok: false, error: string } if blocked.
 */
export async function checkStudentLimitBeforeBooking(input: {
  tutorId: string;
  parentEmail: string;
  studentName?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const email = input.parentEmail.trim().toLowerCase();
  const name = input.studentName?.trim() || "";

  const admin = createAdminClient();

  // 1. Fetch tutor subscription state and resolve tier limits
  const subState = await getTutorSubscriptionState(input.tutorId);
  const tierConfig = SUBSCRIPTION_TIERS[subState.subscriptionTier];

  // If the tier allows unlimited active students, return ok immediately
  if (tierConfig.maxStudents === null) {
    return { ok: true };
  }

  // 2. Check if this student is already active in the tutor's students table
  if (name) {
    const { data: existingStudent } = await admin
      .from("students")
      .select("status")
      .eq("tutor_id", input.tutorId)
      .eq("parent_email", email)
      .eq("student_name", name)
      .maybeSingle();

    if (existingStudent?.status === "active") {
      // Already an active student, doesn't count as a new one
      return { ok: true };
    }
  } else {
    // If no student name is provided, check if the parent already has an active student with this tutor
    const { data: activeStudentsForParent } = await admin
      .from("students")
      .select("id")
      .eq("tutor_id", input.tutorId)
      .eq("parent_email", email)
      .eq("status", "active")
      .limit(1);

    if (activeStudentsForParent && activeStudentsForParent.length > 0) {
      return { ok: true };
    }
  }

  // 3. Count total current active students
  const { count, error: countErr } = await admin
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("tutor_id", input.tutorId)
    .eq("status", "active");

  if (countErr) {
    console.error("[checkStudentLimitBeforeBooking] Error counting active students:", countErr);
    return { ok: true }; // Fail open on DB error
  }

  if (count !== null && count >= tierConfig.maxStudents) {
    return {
      ok: false,
      error: `This tutor has reached the student limit for their current plan. Please contact the tutor directly to request a slot.`,
    };
  }

  return { ok: true };
}
