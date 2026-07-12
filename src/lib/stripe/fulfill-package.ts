import "server-only";

import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export type FulfillPackageResult = {
  ok: boolean;
  alreadyFulfilled?: boolean;
};

export async function fulfillPackageCheckoutFromSession(
  session: Stripe.Checkout.Session,
): Promise<FulfillPackageResult> {
  const metadata = session.metadata ?? {};
  if (metadata.type !== "package") {
    return { ok: false };
  }

  if (session.payment_status !== "paid") {
    return { ok: false };
  }

  const tutorId = metadata.tutor_id;
  const parentEmail = metadata.parent_email?.trim().toLowerCase();
  const parentPhone = metadata.parent_phone || null;
  const studentName = metadata.student_name?.trim() || "Bulk Pupil";
  const lessonsCount = Number(metadata.lessons_count ?? 10);
  const sessionId = session.id;
  const subscribeToAlerts = metadata.subscribe_to_alerts !== "false";

  if (!tutorId || !parentEmail || !sessionId) {
    return { ok: false };
  }

  const admin = createAdminClient();

  // 1. Fetch all students for this parent and tutor to find a match case-insensitively
  const { data: students } = await admin
    .from("students")
    .select("id, student_name, lesson_credits, processed_sessions")
    .eq("tutor_id", tutorId)
    .eq("parent_email", parentEmail);

  // Try to match case-insensitively
  let matchedStudent = students?.find(
    (s) => s.student_name.trim().toLowerCase() === studentName.trim().toLowerCase()
  );

  // If no match, but this parent only has one student, match that student!
  if (!matchedStudent && students && students.length === 1) {
    matchedStudent = students[0];
  }

  if (matchedStudent) {
    // Check if this session has already been processed
    const processed = matchedStudent.processed_sessions || [];
    if (processed.includes(sessionId)) {
      return { ok: true, alreadyFulfilled: true };
    }

    const currentCredits = matchedStudent.lesson_credits ?? 0;
    const updatedProcessed = [...processed, sessionId];

    const { error: updateError } = await admin
      .from("students")
      .update({
        lesson_credits: currentCredits + lessonsCount,
        processed_sessions: updatedProcessed,
        parent_phone: parentPhone,
      })
      .eq("id", matchedStudent.id);

    if (updateError) {
      console.error("Failed to update student credits:", updateError);
      return { ok: false };
    }
  } else {
    // Create new student
    const { error: insertError } = await admin.from("students").insert({
      tutor_id: tutorId,
      parent_email: parentEmail,
      parent_phone: parentPhone,
      student_name: studentName,
      lesson_credits: lessonsCount,
      processed_sessions: [sessionId],
    });

    if (insertError) {
      console.error("Failed to insert student:", insertError);
      return { ok: false };
    }
  }

  // Add to alert list conditionally to receive opening updates
  try {
    if (subscribeToAlerts) {
      await admin.from("slot_alert_subscribers").upsert(
        {
          tutor_id: tutorId,
          parent_email: parentEmail,
          student_name: studentName,
        },
        { onConflict: "tutor_id,parent_email" }
      );
    } else {
      await admin
        .from("slot_alert_subscribers")
        .delete()
        .eq("tutor_id", tutorId)
        .eq("parent_email", parentEmail);
    }
  } catch (alertErr) {
    console.error("Failed to update alert subscriber:", alertErr);
  }

  return { ok: true };
}

export async function fulfillPackageCheckoutFromCheckoutSessionId(
  sessionId: string,
  stripeAccountId: string,
): Promise<FulfillPackageResult> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(
    sessionId,
    {},
    { stripeAccount: stripeAccountId },
  );
  return fulfillPackageCheckoutFromSession(session);
}
