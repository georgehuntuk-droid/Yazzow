import "server-only";

import type Stripe from "stripe";

import { BRAND_NAME, PUBLIC_SITE_URL, TUTOR_SUBSCRIPTION } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

export type TutorSubscriptionState = {
  status: string | null;
  currentPeriodEnd: string | null;
  /** True only after Stripe checkout completed (active sub + customer + subscription id). */
  active: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  /** Database migration 004 not applied — subscription cannot be tracked yet. */
  subscriptionTrackingUnavailable: boolean;
};

export function isSubscriptionActive(status: string | null | undefined): boolean {
  if (!status) return false;
  return (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}

export function isTutorSubscriptionLive(state: TutorSubscriptionState): boolean {
  if (state.subscriptionTrackingUnavailable) return false;
  return (
    isSubscriptionActive(state.status) &&
    Boolean(state.stripeCustomerId) &&
    Boolean(state.stripeSubscriptionId)
  );
}

export async function getTutorSubscriptionState(
  tutorId: string,
): Promise<TutorSubscriptionState> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tutor_profiles")
    .select(
      "subscription_status, subscription_current_period_end, stripe_customer_id, stripe_subscription_id",
    )
    .eq("id", tutorId)
    .maybeSingle();

  const missingSubscriptionColumns =
    error &&
    (error.code === "42703" || error.message.includes("does not exist"));

  if (missingSubscriptionColumns) {
    return {
      status: null,
      currentPeriodEnd: null,
      active: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTrackingUnavailable: true,
    };
  }

  if (error) {
    return {
      status: null,
      currentPeriodEnd: null,
      active: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTrackingUnavailable: false,
    };
  }

  const status = data?.subscription_status ?? null;
  const stripeCustomerId = data?.stripe_customer_id ?? null;
  const stripeSubscriptionId = data?.stripe_subscription_id ?? null;
  const state: TutorSubscriptionState = {
    status,
    currentPeriodEnd: data?.subscription_current_period_end ?? null,
    active: false,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionTrackingUnavailable: false,
  };
  state.active = isTutorSubscriptionLive(state);
  return state;
}

export async function syncTutorSubscriptionFromStripe(
  subscription: Stripe.Subscription,
): Promise<void> {
  const tutorId = subscription.metadata?.tutor_id;
  if (!tutorId) return;

  const admin = createAdminClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const periodEndUnix = getSubscriptionPeriodEndUnix(subscription);

  await admin
    .from("tutor_profiles")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      subscription_status: subscription.status,
      subscription_current_period_end: periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString()
        : null,
    })
    .eq("id", tutorId);
}

function getSubscriptionPeriodEndUnix(subscription: Stripe.Subscription): number | null {
  const rootEnd = (subscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  if (typeof rootEnd === "number") return rootEnd;

  const itemEnd = subscription.items?.data?.[0] as
    | { current_period_end?: number }
    | undefined;
  if (typeof itemEnd?.current_period_end === "number") {
    return itemEnd.current_period_end;
  }

  return null;
}

function subscriptionLineItems(): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID?.trim();
  if (priceId) {
    return [{ price: priceId, quantity: 1 }];
  }

  return [
    {
      price_data: {
        currency: TUTOR_SUBSCRIPTION.currency,
        unit_amount: TUTOR_SUBSCRIPTION.amountCents,
        recurring: { interval: "month" },
        product_data: {
          name: `${BRAND_NAME} tutor plan`,
          description: "Portal, bookings, and dashboard — billed monthly",
        },
      },
      quantity: 1,
    },
  ];
}

export async function createTutorSubscriptionCheckout(input: {
  tutorId: string;
  email: string;
  existingCustomerId?: string | null;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...(input.existingCustomerId
      ? { customer: input.existingCustomerId }
      : { customer_email: input.email }),
    line_items: subscriptionLineItems(),
    allow_promotion_codes: true,
    metadata: {
      type: "tutor_subscription",
      tutor_id: input.tutorId,
    },
    subscription_data: {
      metadata: { tutor_id: input.tutorId },
    },
    success_url: `${PUBLIC_SITE_URL}/dashboard/payments?subscription=active`,
    cancel_url: `${PUBLIC_SITE_URL}/dashboard/payments?subscription=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return session.url;
}

export async function createTutorBillingPortalSession(
  customerId: string,
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${PUBLIC_SITE_URL}/dashboard/payments`,
  });
  return session.url;
}

export async function fulfillTutorSubscriptionCheckout(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.mode !== "subscription") return;

  const tutorId = session.metadata?.tutor_id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!tutorId || !subscriptionId) return;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncTutorSubscriptionFromStripe(subscription);
}
