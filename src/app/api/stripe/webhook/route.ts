import { NextResponse } from "next/server";
import Stripe from "stripe";

import { fulfillLessonBookingFromSession } from "@/lib/stripe/fulfill-lesson-booking";
import {
  fulfillTutorSubscriptionCheckout,
  syncTutorSubscriptionFromStripe,
} from "@/lib/stripe/subscription";
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

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    await syncTutorSubscriptionFromStripe(subscription);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const tutorId = subscription.metadata?.tutor_id;
    if (tutorId) {
      const admin = createAdminClient();
      await admin
        .from("tutor_profiles")
        .update({
          subscription_status: "canceled",
          stripe_subscription_id: null,
        })
        .eq("id", tutorId);
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const type = metadata.type;
  const admin = createAdminClient();

  if (type === "tutor_subscription" || session.mode === "subscription") {
    await fulfillTutorSubscriptionCheckout(session);
    return;
  }

  if (type === "lesson") {
    await fulfillLessonBookingFromSession(session);
    return;
  }

  if (type === "package") {
    const { fulfillPackageCheckoutFromSession } = await import(
      "@/lib/stripe/fulfill-package"
    );
    await fulfillPackageCheckoutFromSession(session);
    return;
  }

  if (type === "digital") {
    const resourceId = metadata.resource_id;
    const tutorId = metadata.tutor_id;
    const buyerEmail = metadata.buyer_email;
    const platformFeeCents = Number(metadata.platform_fee_cents ?? 0);
    const amountCents = session.amount_total ?? 0;

    if (!resourceId || !tutorId || !buyerEmail) return;

    const { data: purchase } = await admin
      .from("resource_purchases")
      .insert({
        resource_id: resourceId,
        tutor_id: tutorId,
        buyer_email: buyerEmail,
        amount_cents: amountCents,
        platform_fee_cents: platformFeeCents,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
      })
      .select("download_token")
      .maybeSingle();

    if (purchase?.download_token) {
      try {
        const [{ data: tutor }, { data: resource }] = await Promise.all([
          admin.from("tutor_profiles").select("display_name").eq("id", tutorId).maybeSingle(),
          admin.from("digital_resources").select("title").eq("id", resourceId).maybeSingle(),
        ]);

        const { sendResourcePurchaseEmail } = await import("@/lib/notifications/booking-update");
        const { PUBLIC_SITE_URL } = await import("@/lib/constants");

        const downloadUrl = `${PUBLIC_SITE_URL}/api/resource/download?token=${purchase.download_token}`;

        await sendResourcePurchaseEmail({
          to: buyerEmail,
          tutorName: tutor?.display_name || "your Tutor",
          resourceTitle: resource?.title || "Worksheet Pack",
          downloadUrl,
        });
      } catch (emailErr) {
        console.error("Failed to send resource download email:", emailErr);
      }
    }
  }
}
