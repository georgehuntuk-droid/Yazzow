import { NextResponse } from "next/server";
import Stripe from "stripe";

import { syncBookingToGoogleCalendar } from "@/lib/calendar/sync-booking";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutCompleted(session);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const type = metadata.type;
  const admin = createAdminClient();

  if (type === "lesson") {
    const slotId = metadata.slot_id;
    const tutorId = metadata.tutor_id;
    const parentEmail = metadata.parent_email;
    const studentName = metadata.student_name || null;
    const platformFeeCents = Number(metadata.platform_fee_cents ?? 0);
    const amountCents = session.amount_total ?? 0;

    if (!slotId || !tutorId || !parentEmail) return;

    await admin
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", slotId)
      .eq("is_booked", false);

    const { data: bookingRow } = await admin
      .from("bookings")
      .insert({
        slot_id: slotId,
        tutor_id: tutorId,
        parent_email: parentEmail,
        student_name: studentName,
        amount_cents: amountCents,
        platform_fee_cents: platformFeeCents,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        status: "confirmed",
      })
      .select("id")
      .single();

    if (bookingRow?.id) {
      try {
        await syncBookingToGoogleCalendar(bookingRow.id);
      } catch (err) {
        console.error("Google Calendar sync failed:", err);
      }
    }

    if (studentName) {
      await admin.from("students").upsert(
        {
          tutor_id: tutorId,
          student_name: studentName,
          parent_email: parentEmail,
        },
        { onConflict: "tutor_id,parent_email,student_name" },
      );
    }

    return;
  }

  if (type === "digital") {
    const resourceId = metadata.resource_id;
    const tutorId = metadata.tutor_id;
    const buyerEmail = metadata.buyer_email;
    const platformFeeCents = Number(metadata.platform_fee_cents ?? 0);
    const amountCents = session.amount_total ?? 0;

    if (!resourceId || !tutorId || !buyerEmail) return;

    await admin.from("resource_purchases").insert({
      resource_id: resourceId,
      tutor_id: tutorId,
      buyer_email: buyerEmail,
      amount_cents: amountCents,
      platform_fee_cents: platformFeeCents,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
    });
  }
}
