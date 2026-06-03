import "server-only";

import { getConnectStatus } from "@/lib/stripe/connect";
import { getTutorSubscriptionState } from "@/lib/stripe/subscription";
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

  const supabase = await createClient();
  const { data: paymentRow } = await supabase
    .from("tutor_profiles")
    .select("stripe_account_id")
    .eq("id", tutorId)
    .maybeSingle();

  const [connect, subscription] = await Promise.all([
    getConnectStatus(paymentRow?.stripe_account_id),
    getTutorSubscriptionState(tutorId),
  ]);

  if (!subscription.active) {
    const status = subscription.status ?? "none";
    return {
      canAcceptBookings: false,
      blockedReason: "subscription_inactive",
      subscriptionActive: false,
      subscriptionStatus: status,
      stripeConnectReady: connect.ready,
      stripeConfigured: true,
      parentMessage:
        "This tutor has open times listed, but paid online booking is paused on Yazzow right now. Please message them directly or check back later.",
      tutorFixSteps: buildSubscriptionFixSteps(status),
    };
  }

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
        'Click "Connect Stripe payouts" and finish all steps in Stripe.',
        "Return to Yazzow — status should show Connected.",
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

function buildSubscriptionFixSteps(status: string): string[] {
  if (status === "none" || !status) {
    return [
      "Open Dashboard → Payments.",
      'Click "Subscribe · £25/month" and complete checkout in Stripe.',
      "After payment, refresh your portal — parents can book immediately.",
    ];
  }
  if (status === "past_due") {
    return [
      "Your subscription payment failed.",
      "Open Dashboard → Payments → Manage billing and update your card.",
    ];
  }
  if (status === "canceled" || status === "unpaid") {
    return [
      "Your Yazzow subscription has ended.",
      "Open Dashboard → Payments and subscribe again to reopen online booking.",
    ];
  }
  return [
    `Subscription status: ${status}.`,
    "Open Dashboard → Payments to review billing or contact support.",
  ];
}
