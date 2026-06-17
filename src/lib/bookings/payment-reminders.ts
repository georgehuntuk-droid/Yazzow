import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/format";

export async function runAutomatedPaymentReminders(tutorId: string): Promise<void> {
  const admin = createAdminClient();

  // 1. Fetch tutor settings
  const { data: tutor, error: tutorError } = await admin
    .from("tutor_profiles")
    .select("currency, display_name, payment_reminder_amount_threshold_cents, payment_reminder_days_after")
    .eq("id", tutorId)
    .maybeSingle();

  if (tutorError || !tutor) return;

  const thresholdCents = (tutor as any).payment_reminder_amount_threshold_cents ?? 0;
  const daysAfter = (tutor as any).payment_reminder_days_after ?? 0;

  // If both are 0, automated reminders are disabled
  if (thresholdCents === 0 && daysAfter === 0) return;

  // 2. Fetch confirmed, unpaid cash bookings
  // We include payment_reminder_sent_at in selection, but fallback if missing
  let selectQuery = `
    id,
    parent_email,
    amount_cents,
    created_at,
    payment_reminder_sent_at,
    availability_slots (ends_at)
  `;

  let res = await admin
    .from("bookings")
    .select(selectQuery)
    .eq("tutor_id", tutorId)
    .eq("status", "confirmed")
    .eq("is_paid", false)
    .eq("stripe_payment_intent_id", "cash");

  if (res.error && (res.error.code === "42703" || res.error.message.includes("payment_reminder_sent_at"))) {
    selectQuery = `
      id,
      parent_email,
      amount_cents,
      created_at,
      availability_slots (ends_at)
    `;
    res = await admin
      .from("bookings")
      .select(selectQuery)
      .eq("tutor_id", tutorId)
      .eq("status", "confirmed")
      .eq("is_paid", false)
      .eq("stripe_payment_intent_id", "cash");
  }

  const bookings = res.data as any[];
  if (res.error || !bookings || bookings.length === 0) return;

  // 3. Group by parent email
  const parentGroups = new Map<string, any[]>();
  for (const b of bookings) {
    const list = parentGroups.get(b.parent_email) ?? [];
    list.push(b);
    parentGroups.set(b.parent_email, list);
  }

  const now = new Date();

  // 4. Process each parent
  for (const [parentEmail, parentBookings] of parentGroups.entries()) {
    const totalOwedCents = parentBookings.reduce((sum, b) => sum + b.amount_cents, 0);

    let shouldTrigger = false;

    // Check threshold trigger
    if (thresholdCents > 0 && totalOwedCents >= thresholdCents) {
      shouldTrigger = true;
    }

    // Check timed trigger
    if (!shouldTrigger && daysAfter > 0) {
      for (const b of parentBookings) {
        const slot = Array.isArray(b.availability_slots) ? b.availability_slots[0] : b.availability_slots;
        const endTimeStr = slot?.ends_at ?? b.created_at;
        if (endTimeStr) {
          const daysPassed = (now.getTime() - new Date(endTimeStr).getTime()) / (1000 * 60 * 60 * 24);
          if (daysPassed >= daysAfter) {
            // Also ensure we haven't already sent a reminder for this booking
            const reminderSentAt = (b as any).payment_reminder_sent_at;
            if (!reminderSentAt) {
              shouldTrigger = true;
              break;
            }
          }
        }
      }
    }

    if (!shouldTrigger) continue;

    // 5. Prevent spam - check if we sent a payment reminder chat message in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentMsg } = await admin
      .from("messages")
      .select("id")
      .eq("tutor_id", tutorId)
      .eq("parent_email", parentEmail)
      .eq("sender", "tutor")
      .like("content", "%[Payment Reminder]%")
      .gte("created_at", sevenDaysAgo)
      .limit(1)
      .maybeSingle();

    if (recentMsg) continue; // Skip if sent recently

    // 6. Send the in-app chat reminder
    const messageContent = `🔔 [Payment Reminder] Hello, this is a friendly reminder that you have an outstanding balance of ${formatMoney(totalOwedCents, tutor.currency)} for our lessons. Please view payment instructions and settle at your convenience. Thank you!`;
    
    const { error: msgErr } = await admin.from("messages").insert({
      tutor_id: tutorId,
      parent_email: parentEmail,
      sender: "tutor",
      content: messageContent,
    });

    if (msgErr) {
      console.error("Failed to insert auto payment reminder message:", msgErr);
      continue;
    }

    // 7. Mark all these bookings as reminded
    const bookingIds = parentBookings.map((b) => b.id);
    const updatePayload: any = { payment_reminder_sent_at: now.toISOString() };
    
    const { error: updateErr } = await admin
      .from("bookings")
      .update(updatePayload)
      .in("id", bookingIds);

    if (updateErr && (updateErr.code === "42703" || updateErr.message.includes("payment_reminder_sent_at"))) {
      // Ignore if column is missing
    }
  }
}
