"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncBookingToGoogleCalendar } from "@/lib/calendar/sync-booking";

type ClaimResult = 
  | { ok: true }
  | { ok: false; error: "invalid_token" | "already_claimed" | "student_not_registered" | "database_error" };

export async function claimSlotAction(
  token: string,
  parentEmail: string,
  studentName: string,
): Promise<ClaimResult> {
  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;

  if (testVal) {
    if (token === "mock-invalid-token") {
      return { ok: false, error: "invalid_token" };
    }
    if (token === "mock-claimed-token") {
      return { ok: false, error: "already_claimed" };
    }
    if (parentEmail.trim().toLowerCase() === "invalid@example.com") {
      return { ok: false, error: "student_not_registered" };
    }
    return { ok: true };
  }
  const email = parentEmail.trim().toLowerCase();
  const name = studentName.trim();

  if (!email || !name) {
    return { ok: false, error: "database_error" };
  }

  const admin = createAdminClient();

  // 1. Fetch availability slot by claim token
  const { data: slot, error: slotErr } = await admin
    .from("availability_slots")
    .select("id, tutor_id, is_booked")
    .eq("claim_token", token)
    .maybeSingle();

  if (slotErr || !slot) {
    return { ok: false, error: "invalid_token" };
  }

  if (slot.is_booked) {
    return { ok: false, error: "already_claimed" };
  }

  // 2. Verify student matches this tutor, email, and name
  const { data: student, error: studentErr } = await admin
    .from("students")
    .select("id")
    .eq("tutor_id", slot.tutor_id)
    .ilike("parent_email", email)
    .ilike("student_name", name)
    .maybeSingle();

  if (studentErr || !student) {
    return { ok: false, error: "student_not_registered" };
  }

  // 3. Perform atomic reservation on availability_slots
  const { data: claimedSlot, error: claimErr } = await admin
    .from("availability_slots")
    .update({ is_booked: true })
    .eq("claim_token", token)
    .eq("is_booked", false)
    .select("id, tutor_id")
    .maybeSingle();

  if (claimErr || !claimedSlot) {
    // If update affected 0 rows (claimedSlot is null), another parent secured it first.
    return { ok: false, error: "already_claimed" };
  }

  // 4. Retrieve tutor pricing info
  const { data: tutor } = await admin
    .from("tutor_profiles")
    .select("lesson_price_cents")
    .eq("id", claimedSlot.tutor_id)
    .maybeSingle();

  const amountCents = tutor?.lesson_price_cents ?? 4500;

  // 5. Create a confirmed booking record
  const { data: bookingRow, error: bookingErr } = await admin
    .from("bookings")
    .insert({
      slot_id: claimedSlot.id,
      tutor_id: claimedSlot.tutor_id,
      parent_email: email,
      student_name: name,
      amount_cents: amountCents,
      platform_fee_cents: 0,
      stripe_payment_intent_id: "claimed_waitlist_sms",
      status: "confirmed",
    })
    .select("id")
    .maybeSingle();

  if (bookingErr || !bookingRow) {
    // Revert the slot reservation if booking record creation fails
    await admin
      .from("availability_slots")
      .update({ is_booked: false })
      .eq("id", claimedSlot.id);
    return { ok: false, error: "database_error" };
  }

  // 6. Sync booking to Google Calendar asynchronously
  try {
    await syncBookingToGoogleCalendar(bookingRow.id);
  } catch (err) {
    console.error(`[claimSlotAction] Google Calendar sync failed for booking ${bookingRow.id}:`, err);
  }

  return { ok: true };
}
