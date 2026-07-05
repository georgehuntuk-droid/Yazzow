import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncBookingToGoogleCalendar } from "@/lib/calendar/sync-booking";

export async function POST(request: Request) {
  try {
    const { slotId, tutorId, parentEmail, studentName, subscribeToAlerts } = await request.json();

    if (!slotId || !tutorId || !parentEmail) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const email = parentEmail.trim().toLowerCase();
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

    // 2. Fetch student records matching this parent-tutor relationship
    const { data: students } = await admin
      .from("students")
      .select("id, student_name, lesson_credits, credit_limit")
      .eq("tutor_id", tutorId)
      .eq("parent_email", email);

    if (!students || students.length === 0) {
      return NextResponse.json({ error: "No student profile found. Please join the tutor family first." }, { status: 400 });
    }

    // Filter students who have not exceeded their credit limit
    const eligibleStudents = students.filter(
      (s) => !(s.credit_limit ?? 0) || (s.lesson_credits ?? 0) - 1 >= -(s.credit_limit ?? 0)
    );

    if (eligibleStudents.length === 0) {
      return NextResponse.json({ error: "You have exceeded your booking credit limit. Please contact your tutor." }, { status: 400 });
    }

    // Pick the most eligible student record to deduct credit from
    let selectedStudent = eligibleStudents[0];
    if (studentName) {
      const match = eligibleStudents.find(
        (s) => s.student_name.trim().toLowerCase() === studentName.trim().toLowerCase()
      );
      if (match) selectedStudent = match;
    }

    // 3. Deduct 1 credit from the chosen student record (can be negative)
    const newCredits = (selectedStudent.lesson_credits ?? 0) - 1;
    const { error: deductError } = await admin
      .from("students")
      .update({ lesson_credits: newCredits })
      .eq("id", selectedStudent.id);

    if (deductError) {
      return NextResponse.json({ error: "Could not deduct lesson credit." }, { status: 500 });
    }

    // 4. Mark slot as booked
    await admin
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", slotId);

    // 5. Create confirmed booking record with amount_cents = 0 (paid with credit)
    const { data: bookingRow, error: bookingError } = await admin
      .from("bookings")
      .insert({
        slot_id: slotId,
        tutor_id: tutorId,
        parent_email: email,
        student_name: studentName?.trim() || selectedStudent.student_name,
        amount_cents: 0,
        platform_fee_cents: 0,
        status: "confirmed",
      })
      .select("id")
      .single();

    if (bookingError || !bookingRow) {
      // Revert credit deduction and slot booking on failure
      await admin.from("students").update({ lesson_credits: selectedStudent.lesson_credits }).eq("id", selectedStudent.id);
      await admin.from("availability_slots").update({ is_booked: false }).eq("id", slotId);
      return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
    }

    // Sync to Google calendar asynchronously
    try {
      await syncBookingToGoogleCalendar(bookingRow.id);
    } catch (err) {
      console.error("Google Calendar sync failed:", err);
    }

    // 6. Subscribe/Unsubscribe parent to slot alerts
    if (subscribeToAlerts !== false) {
      await admin.from("slot_alert_subscribers").upsert(
        {
          tutor_id: tutorId,
          parent_email: email,
          student_name: studentName?.trim() || selectedStudent.student_name,
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

    // Trigger emails
    try {
      const [{ data: slotRow }, { data: tutorRow }] = await Promise.all([
        admin
          .from("availability_slots")
          .select("starts_at, ends_at")
          .eq("id", slotId)
          .maybeSingle(),
        admin
          .from("tutor_profiles")
          .select("display_name, username, currency")
          .eq("id", tutorId)
          .maybeSingle(),
      ]);

      if (slotRow && tutorRow) {
        const { sendBookingConfirmationEmail } = await import(
          "@/lib/notifications/booking-confirmation"
        );
        await sendBookingConfirmationEmail({
          bookingId: bookingRow.id,
          parentEmail: email,
          studentName: studentName?.trim() || selectedStudent.student_name,
          startsAt: slotRow.starts_at,
          endsAt: slotRow.ends_at,
          tutorName: tutorRow.display_name,
          tutorUsername: tutorRow.username,
          amountCents: 0,
          currency: tutorRow.currency,
          isCreditPayment: true,
        });
      }
    } catch (emailErr) {
      console.error("Fulfillment emails failed:", emailErr);
    }

    return NextResponse.json({ ok: true, bookingId: bookingRow.id });
  } catch (error) {
    console.error("Credit booking endpoint failure:", error);
    return NextResponse.json({ error: "Server error during credit booking." }, { status: 500 });
  }
}
