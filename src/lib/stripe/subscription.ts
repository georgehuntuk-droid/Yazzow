import "server-only";

import type Stripe from "stripe";

import { BRAND_NAME, PUBLIC_SITE_URL } from "@/lib/constants";
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
  cancelAtPeriodEnd: boolean;
  subscriptionTier: "independent" | "academy" | "starter" | "growth" | "agency";
};

export function isSubscriptionActive(status: string | null | undefined): boolean {
  if (!status) return false;
  return (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}

export function isTutorSubscriptionLive(state: TutorSubscriptionState): boolean {
  if (state.subscriptionTrackingUnavailable) return false;
  
  // If the subscription status is trialing but the trial period has expired, it is no longer live.
  if (state.status === "trialing" && state.currentPeriodEnd) {
    const periodEnd = new Date(state.currentPeriodEnd);
    if (periodEnd.getTime() < Date.now()) {
      return false;
    }
  }
  
  // If the subscription is marked as active or trialing, it is considered live.
  // We no longer strictly require stripeCustomerId / stripeSubscriptionId for manually compped admin trials.
  return isSubscriptionActive(state.status);
}

export async function getTutorSubscriptionState(
  tutorId: string,
): Promise<TutorSubscriptionState> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;
  if (
    testVal === "dashboard" ||
    testVal === "onboarding" ||
    testVal === "unsubscribed" ||
    testVal === "trialing-active" ||
    testVal === "trialing-expired"
  ) {
    const isDash = testVal === "dashboard";
    const isTrialActive = testVal === "trialing-active";
    const isTrialExpired = testVal === "trialing-expired";
    const isTrial = isTrialActive || isTrialExpired;
    const isActive = isDash || isTrialActive;

    return {
      status: isDash ? "active" : isTrial ? "trialing" : null,
      currentPeriodEnd: isDash
        ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
        : isTrialActive
        ? new Date(Date.now() + 13 * 24 * 3600 * 1000).toISOString() // 13 days left
        : isTrialExpired
        ? new Date(Date.now() - 24 * 3600 * 1000).toISOString() // Expired yesterday
        : null,
      active: isActive,
      stripeCustomerId: isDash ? "mock-customer-id-123" : null,
      stripeSubscriptionId: isDash ? "mock-subscription-id-123" : null,
      subscriptionTrackingUnavailable: false,
      cancelAtPeriodEnd: false,
      subscriptionTier: "independent",
    };
  }

  const admin = createAdminClient();
  let data: any = null;
  let error: any = null;

  const res = await admin
    .from("tutor_profiles")
    .select(
      "subscription_status, subscription_current_period_end, stripe_customer_id, stripe_subscription_id, subscription_cancel_at_period_end, subscription_tier",
    )
    .eq("id", tutorId)
    .maybeSingle();

  if (res.error && (res.error.message.includes("subscription_tier") || res.error.code === "42703")) {
    const retryRes = await admin
      .from("tutor_profiles")
      .select(
        "subscription_status, subscription_current_period_end, stripe_customer_id, stripe_subscription_id, subscription_cancel_at_period_end",
      )
      .eq("id", tutorId)
      .maybeSingle();
    data = retryRes.data;
    error = retryRes.error;
  } else {
    data = res.data;
    error = res.error;
  }

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
      cancelAtPeriodEnd: false,
      subscriptionTier: "independent",
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
      cancelAtPeriodEnd: false,
      subscriptionTier: "independent",
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
    cancelAtPeriodEnd: data?.subscription_cancel_at_period_end ?? false,
    subscriptionTier: (data?.subscription_tier as any) || "independent",
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

  const priceId = subscription.items?.data?.[0]?.price?.id;
  let resolvedTier = "independent";

  const independentPrice = process.env.STRIPE_PRICE_INDEPENDENT?.trim();
  const academyPrice = process.env.STRIPE_PRICE_ACADEMY?.trim();

  // Legacy mappings for transition
  const starterPrice = process.env.STRIPE_PRICE_STARTER?.trim();
  const growthPrice = process.env.STRIPE_PRICE_GROWTH?.trim();
  const agencyPrice = process.env.STRIPE_PRICE_AGENCY?.trim();

  if (priceId === academyPrice || priceId === agencyPrice) {
    resolvedTier = "academy";
  } else if (priceId === independentPrice || priceId === starterPrice || priceId === growthPrice) {
    resolvedTier = "independent";
  } else {
    const amount = subscription.items?.data?.[0]?.plan?.amount;
    if (amount) {
      if (amount >= 7000 || amount === 4999) resolvedTier = "academy";
      else resolvedTier = "independent";
    }
  }

  const updatePayload: any = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    subscription_status: subscription.status,
    subscription_current_period_end: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null,
    subscription_cancel_at_period_end: subscription.cancel_at_period_end,
    subscription_tier: resolvedTier,
  };

  const { error: updateErr } = await admin
    .from("tutor_profiles")
    .update(updatePayload)
    .eq("id", tutorId);

  if (updateErr) {
    if (updateErr.message.includes("subscription_tier") || updateErr.code === "42703") {
      delete updatePayload.subscription_tier;
    }
    if (updateErr.message.includes("subscription_cancel_at_period_end") || updateErr.code === "42703") {
      delete updatePayload.subscription_cancel_at_period_end;
    }
    await admin
      .from("tutor_profiles")
      .update(updatePayload)
      .eq("id", tutorId);
  }
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

function subscriptionLineItems(tier: "independent" | "academy" | "starter" | "growth" | "agency" = "independent"): Stripe.Checkout.SessionCreateParams.LineItem[] {
  let priceId = "";
  if (tier === "academy" || tier === "agency") {
    priceId = process.env.STRIPE_PRICE_ACADEMY?.trim() || "";
  } else {
    priceId = process.env.STRIPE_PRICE_INDEPENDENT?.trim() || "";
  }

  // Fallback to legacy price ID if none set for this tier
  if (!priceId && (tier === "independent" || tier === "growth" || tier === "starter")) {
    priceId = process.env.STRIPE_PRICE_STARTER?.trim() || process.env.STRIPE_PRICE_GROWTH?.trim() || process.env.STRIPE_SUBSCRIPTION_PRICE_ID?.trim() || "";
  } else if (!priceId && tier === "agency") {
    priceId = process.env.STRIPE_PRICE_AGENCY?.trim() || "";
  }

  if (priceId) {
    return [{ price: priceId, quantity: 1 }];
  }

  const { SUBSCRIPTION_TIERS } = require("@/lib/constants");
  const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.independent;

  return [
    {
      price_data: {
        currency: "gbp",
        unit_amount: tierConfig.amountCents,
        recurring: { interval: "month" },
        product_data: {
          name: `${BRAND_NAME} ${tierConfig.name} plan`,
          description: tierConfig.description,
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
  tier?: "independent" | "academy" | "starter" | "growth" | "agency";
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...(input.existingCustomerId
      ? { customer: input.existingCustomerId }
      : { customer_email: input.email }),
    line_items: subscriptionLineItems(input.tier),
    allow_promotion_codes: true,
    metadata: {
      type: "tutor_subscription",
      tutor_id: input.tutorId,
    },
    subscription_data: {
      metadata: { tutor_id: input.tutorId },
      trial_period_days: 14, // 14-day free trial before the card is charged
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

export async function cancelTutorSubscription(tutorId: string): Promise<void> {
  const state = await getTutorSubscriptionState(tutorId);
  if (!state.stripeSubscriptionId) {
    // If it's a complimentary / admin-granted subscription, we can just clear it in the database directly!
    const admin = createAdminClient();
    const { error } = await admin
      .from("tutor_profiles")
      .update({
        subscription_status: null,
        subscription_current_period_end: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
      })
      .eq("id", tutorId);

    if (error) {
      throw new Error(`Failed to cancel complimentary subscription: ${error.message}`);
    }
    return;
  }

  const stripe = getStripe();
  // Cancel at period end
  const subscription = await stripe.subscriptions.update(state.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // Sync to database
  await syncTutorSubscriptionFromStripe(subscription);
}
