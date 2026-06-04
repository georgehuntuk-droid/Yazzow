import "server-only";

import { getConnectStatus } from "@/lib/stripe/connect";
import {
  getTutorSubscriptionState,
  isTutorSubscriptionLive,
} from "@/lib/stripe/subscription";
import { isStripeConfigured } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export type PortalBookingBlockedReason =
  | "demo"
  | "stripe_not_configured"
  | "subscription_inactive"
  | "stripe_connect_incomplete"
  | null;

export type PortalBookingStatus = {
  canAcceptBookings: boolean;
  blockedReason: PortalBookingBlockedReason;
  subscriptionActive: boolean;
  subscriptionStatus: string | null;
  stripeConnectReady: boolean;
  stripeConfigured: boolean;
  /** Parent-facing short explanation */
  parentMessage: string;
  /** Tutor-facing fix steps */
  tutorFixSteps: string[];
};

export async function getPortalBookingStatus(
  tutorId: string,
  options?: { isDemo?: boolean },
): Promise<PortalBookingStatus> {
  if (options?.isDemo) {
    return {
      canAcceptBookings: false,
      blockedReason: "demo",
      subscriptionActive: false,
      subscriptionStatus: null,
      stripeConnectReady: false,
      stripeConfigured: isStripeConfigured(),
      parentMessage: "This is a sample portal — bookings are not live here.",
      tutorFixSteps: ["Share your real portal link from the dashboard, not /tutor/demo."],
    };
  }

  const stripeConfigured = isStripeConfigured();
  if (!stripeConfigured) {
    return {
      canAcceptBookings: false,
      blockedReason: "stripe_not_configured",
      subscriptionActive: false,
      subscriptionStatus: null,
      stripeConnectReady: false,
      stripeConfigured: false,
      parentMessage:
        "Online booking is not switched on for this site yet. Please contact the tutor directly.",
      tutorFixSteps: [
        "Add STRIPE_SECRET_KEY to the server environment (Netlify env vars).",
        "Redeploy the site after saving variables.",
      ],
    };
  }

  const subscription = await getTutorSubscriptionState(tutorId);

  if (subscription.subscriptionTrackingUnavailable) {
    return {
      canAcceptBookings: false,
      blockedReason: "subscription_inactive",
      subscriptionActive: false,
      subscriptionStatus: "setup required",
      stripeConnectReady: false,
      stripeConfigured: true,
      parentMessage:
        "This tutor has open times listed, but paid online booking is paused on Yazzow right now. Please message them directly or check back later.",
      tutorFixSteps: [
        "Billing setup is temporarily undergoing maintenance. Please contact support.",
      ],
    };
  }

  if (!isTutorSubscriptionLive(subscription)) {
    const status = subscription.status ?? "none";
    return {
      canAcceptBookings: false,
      blockedReason: "subscription_inactive",
      subscriptionActive: false,
      subscriptionStatus: status === "none" || !status ? "not subscribed" : status,
      stripeConnectReady: false,
      stripeConfigured: true,
      parentMessage:
        "This tutor has open times listed, but paid online booking is paused on Yazzow right now. Please message them directly or check back later.",
      tutorFixSteps: buildSubscriptionFixSteps(status),
    };
  }

  // ONLY query Stripe if subscription is active
  const supabase = await createClient();
  const { data: paymentRow } = await supabase
    .from("tutor_profiles")
    .select("stripe_account_id")
    .eq("id", tutorId)
    .maybeSingle();

  const connect = await getConnectStatus(paymentRow?.stripe_account_id);

  if (!connect.ready) {
    return {
      canAcceptBookings: false,
      blockedReason: "stripe_connect_incomplete",
      subscriptionActive: true,
      subscriptionStatus: subscription.status,
      stripeConnectReady: false,
      stripeConfigured: true,
      parentMessage:
        "This tutor is still setting up card payments, so online checkout is not available yet. Please contact them to arrange payment.",
      tutorFixSteps: [
        "Open Dashboard → Payments.",
        "Click 'Connect Stripe payouts' to complete your verification.",
      ],
    };
  }

  return {
    canAcceptBookings: true,
    blockedReason: null,
    subscriptionActive: true,
    subscriptionStatus: subscription.status,
    stripeConnectReady: true,
    stripeConfigured: true,
    parentMessage: "",
    tutorFixSteps: [],
  };
}

function buildSubscriptionFixSteps(status: string | null): string[] {
  if (status === "unpaid" || status === "past_due") {
    return [
      "Open Dashboard → Payments.",
      "Click 'Manage billing' and update your card — Stripe is reporting a payment failure.",
    ];
  }

  return [
    "Open Dashboard → Payments.",
    "Click 'Subscribe now' to activate your tutor plan.",
  ];
}
