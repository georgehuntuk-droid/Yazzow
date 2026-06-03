import { NextResponse } from "next/server";

import { PUBLIC_SITE_URL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DigitalResourceRow, TutorProfileRow } from "@/lib/supabase/database.types";
import { calculatePlatformFee } from "@/lib/stripe/fees";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

type ResourceCheckoutBody = {
  resourceId: string;
  tutorUsername: string;
  buyerEmail: string;
};

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments not configured yet." }, { status: 503 });
  }

  const body = (await request.json()) as ResourceCheckoutBody;
  const { resourceId, tutorUsername, buyerEmail } = body;

  if (!resourceId || !tutorUsername || !buyerEmail) {
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
      { error: "This tutor has not connected payouts yet." },
      { status: 400 },
    );
  }

  const { data: resourceData } = await admin
    .from("digital_resources")
    .select("*")
    .eq("id", resourceId)
    .eq("tutor_id", tutor.id)
    .eq("is_published", true)
    .maybeSingle();

  const resource = resourceData as DigitalResourceRow | null;

  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const platformFeeCents = calculatePlatformFee(resource.price_cents, "digital");
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: buyerEmail,
      line_items: [
        {
          price_data: {
            currency: resource.currency,
            unit_amount: resource.price_cents,
            product_data: {
              name: resource.title,
              description: resource.description ?? "Digital worksheet pack",
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
      },
      metadata: {
        type: "digital",
        resource_id: resourceId,
        tutor_id: tutor.id,
        buyer_email: buyerEmail,
        platform_fee_cents: String(platformFeeCents),
      },
      success_url: `${PUBLIC_SITE_URL}/tutor/${tutorUsername}?purchased=1`,
      cancel_url: `${PUBLIC_SITE_URL}/tutor/${tutorUsername}?cancelled=1`,
    },
    { stripeAccount: tutor.stripe_account_id },
  );

  return NextResponse.json({ url: session.url });
}
