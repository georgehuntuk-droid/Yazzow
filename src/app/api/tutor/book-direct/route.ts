import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncBookingToGoogleCalendar } from "@/lib/calendar/sync-booking";

export async function POST(request: Request) {
  try {
    const { slotId, tutorId, parentEmail, parentPhone, studentName, subscribeToAlerts } = await request.json();

    if (!slotId || !tutorId || !parentEmail) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const email = parentEmail.trim().toLowerCase();
    
    const { isUserBanned } = await import("@/lib/auth/ban-check");
    if (await isUserBanned(email)) {
      return NextResponse.json({ error: "This email is suspended from making bookings." }, { status: 403 });
    }

    const admin = createAdminClient();

    // 1. Double check slot availability
    const { data: slot } = await admin
      .from("availability_slots")
      .select("*")
      .eq("id", slotId)
      .eq("tutor_id", tutorId)
      .eq("is_booked", false)
      .maybeSingle();

    if (!slot) {
      return NextResponse.json({ error: "That slot is no longer available." }, { status: 409 });
    }

    // Check if tutor active student limit is reached
    const { checkStudentLimitBeforeBooking } = await import("@/lib/bookings/limits");
    const limitCheck = await checkStudentLimitBeforeBooking({
      tutorId,
      parentEmail: email,
      studentName,
    });
    if (!limitCheck.ok) {
      return NextResponse.json({ error: limitCheck.error }, { status: 403 });
    }

    // 2. Fetch tutor details & price
    const { data: tutor } = await admin
      .from("tutor_profiles")
      .select("display_name, username, currency, lesson_price_cents, allow_cash_payments, payment_instructions")
      .eq("id", tutorId)
      .maybeSingle();

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
    }

    if (tutor.allow_cash_payments === false) {
      return NextResponse.json({ error: "Cash bookings are not allowed for this tutor." }, { status: 400 });
    }

    // 3. Mark slot as booked
    await admin
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", slotId);

    const slotDurationMs = new Date(slot.ends_at).getTime() - new Date(slot.starts_at).getTime();
    const durationHours = slotDurationMs / (60 * 60 * 1000);
    const amountCents = Math.max(50, Math.round(tutor.lesson_price_cents * durationHours));

    // 4. Create pending booking record with amount_cents and payment intent set to "cash"
    const { data: bookingRow, error: bookingError } = await admin
      .from("bookings")
      .insert({
        slot_id: slotId,
        tutor_id: tutorId,
        parent_email: email,
        parent_phone: parentPhone || null,
        student_name: studentName?.trim() || null,
        amount_cents: amountCents,
        platform_fee_cents: 0,
        stripe_payment_intent_id: "cash",
        status: "pending",
      })
      .select("id")
      .single();

    if (bookingError || !bookingRow) {
      await admin.from("availability_slots").update({ is_booked: false }).eq("id", slotId);
      return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
    }

    // 5. Sync to Google calendar asynchronously
    try {
      await syncBookingToGoogleCalendar(bookingRow.id);
    } catch (err) {
      console.error("Google Calendar sync failed:", err);
    }

    // 6. Upsert student record
    if (studentName?.trim()) {
      await admin.from("students").upsert(
        {
          tutor_id: tutorId,
          student_name: studentName.trim(),
          parent_email: email,
          parent_phone: parentPhone || null,
        },
        { onConflict: "tutor_id,parent_email,student_name" }
      );
    }

    // 7. Subscribe/Unsubscribe parent to slot alerts
    if (subscribeToAlerts !== false) {
      await admin.from("slot_alert_subscribers").upsert(
        {
          tutor_id: tutorId,
          parent_email: email,
          student_name: studentName?.trim() || null,
        },
        { onConflict: "tutor_id,parent_email" }
      );
    } else {
      await admin
        .from("slot_alert_subscribers")
        .delete()
        .eq("tutor_id", tutorId)
        .eq("parent_email", email);
    }

    // 8. Trigger confirmation email
    try {
      const { sendBookingConfirmationEmail } = await import(
        "@/lib/notifications/booking-confirmation"
      );
      await sendBookingConfirmationEmail({
        bookingId: bookingRow.id,
        to: email,
        tutorName: tutor.display_name,
        tutorUsername: tutor.username,
        studentName: studentName?.trim() || null,
        startsAt: slot.starts_at,
        endsAt: slot.ends_at,
        amountCents: amountCents,
        currency: tutor.currency,
        status: "pending",
        paymentInstructions: tutor.payment_instructions,
      });
    } catch (emailErr) {
      console.error("Fulfillment emails failed:", emailErr);
    }

    return NextResponse.json({ ok: true, bookingId: bookingRow.id });
  } catch (error) {
    console.error("Direct/Cash booking endpoint failure:", error);
    return NextResponse.json({ error: "Server error during booking." }, { status: 500 });
  }
}
