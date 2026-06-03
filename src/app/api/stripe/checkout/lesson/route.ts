import { NextResponse } from "next/server";

import { LESSON_SLOT_DURATION_MINUTES, PUBLIC_SITE_URL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TutorProfileRow } from "@/lib/supabase/database.types";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { getTutorSubscriptionState } from "@/lib/stripe/subscription";

type LessonCheckoutBody = {
  slotId: string;
  tutorUsername: string;
  parentEmail: string;
  studentName?: string;
};

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments not configured yet." }, { status: 503 });
  }

  const body = (await request.json()) as LessonCheckoutBody;
  const { slotId, tutorUsername, parentEmail, studentName } = body;

  if (!slotId || !tutorUsername || !parentEmail) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: tutorData } = await admin
    .from("tutor_profiles")
    .select("*")
    .eq("username", tutorUsername)
    .maybeSingle();

  const tutor = tutorData as TutorProfileRow | null;

  if (!tutor?.stripe_account_id) {
    return NextResponse.json(
      { error: "This tutor has not connected payouts yet. Try again later." },
      { status: 400 },
    );
  }

  const subscription = await getTutorSubscriptionState(tutor.id);
  if (!subscription.active) {
    return NextResponse.json(
      { error: "This tutor's booking portal is not active right now." },
      { status: 403 },
    );
  }

  const { data: slot } = await admin
    .from("availability_slots")
    .select("*")
    .eq("id", slotId)
    .eq("tutor_id", tutor.id)
    .eq("is_booked", false)
    .maybeSingle();

  if (!slot) {
    return NextResponse.json({ error: "That slot is no longer available." }, { status: 409 });
  }

  const slotDurationMs =
    new Date(slot.ends_at).getTime() - new Date(slot.starts_at).getTime();
  const expectedMs = LESSON_SLOT_DURATION_MINUTES * 60 * 1000;
  if (slotDurationMs !== expectedMs) {
    return NextResponse.json(
      { error: "This slot is not a valid one-hour booking." },
      { status: 400 },
    );
  }

  const amountCents = tutor.lesson_price_cents;
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: parentEmail,
      line_items: [
        {
          price_data: {
            currency: tutor.currency,
            unit_amount: amountCents,
            product_data: {
              name: `Lesson with ${tutor.display_name}`,
              description: "Paid upfront · Yazzow booking",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "lesson",
        slot_id: slotId,
        tutor_id: tutor.id,
        parent_email: parentEmail,
        student_name: studentName ?? "",
        platform_fee_cents: "0",
      },
      success_url: `${PUBLIC_SITE_URL}/tutor/${tutorUsername}?booked=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PUBLIC_SITE_URL}/tutor/${tutorUsername}?cancelled=1`,
    },
    { stripeAccount: tutor.stripe_account_id },
  );

  return NextResponse.json({ url: session.url });
}
