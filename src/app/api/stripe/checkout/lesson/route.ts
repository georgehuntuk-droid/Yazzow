import { NextResponse } from "next/server";

import { PUBLIC_SITE_URL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TutorProfileRow } from "@/lib/supabase/database.types";
import { calculatePlatformFee } from "@/lib/stripe/fees";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

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

  const amountCents = tutor.lesson_price_cents;
  const platformFeeCents = calculatePlatformFee(amountCents, "lesson");
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
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
      },
      metadata: {
        type: "lesson",
        slot_id: slotId,
        tutor_id: tutor.id,
        parent_email: parentEmail,
        student_name: studentName ?? "",
        platform_fee_cents: String(platformFeeCents),
      },
      success_url: `${PUBLIC_SITE_URL}/tutor/${tutorUsername}?booked=1`,
      cancel_url: `${PUBLIC_SITE_URL}/tutor/${tutorUsername}?cancelled=1`,
    },
    { stripeAccount: tutor.stripe_account_id },
  );

  return NextResponse.json({ url: session.url });
}
