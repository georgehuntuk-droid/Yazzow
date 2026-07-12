import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriptionActive } from "@/lib/stripe/subscription";

export type PlatformRevenueStats = {
  activeSubscriptions: number;
  payingSubscriptions: number;
  compedSubscriptions: number;
  estimatedSubscriptionMrrCents: number;
  digitalSales30d: number;
  digitalSales30dGrossCents: number;
  lessonBookings30d: number;
  lessonVolume30dCents: number;
};

export async function getPlatformRevenueStats(): Promise<PlatformRevenueStats> {
  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [tutorsRes, purchasesRes, bookingsRes] = await Promise.all([
    admin.from("tutor_profiles").select("subscription_status, stripe_subscription_id, subscription_tier"),
    admin
      .from("resource_purchases")
      .select("amount_cents, platform_fee_cents")
      .gte("created_at", sinceIso),
    admin
      .from("bookings")
      .select("amount_cents")
      .eq("status", "confirmed")
      .gte("created_at", sinceIso),
  ]);

  const { SUBSCRIPTION_TIERS } = await import("@/lib/constants");

  const tutors = tutorsRes.data ?? [];
  let activeSubscriptions = 0;
  let payingSubscriptions = 0;
  let compedSubscriptions = 0;
  let estimatedSubscriptionMrrCents = 0;

  tutors.forEach((row) => {
    if (isSubscriptionActive(row.subscription_status)) {
      activeSubscriptions++;
      if (row.stripe_subscription_id) {
        payingSubscriptions++;
        const tierKey = (row.subscription_tier || "independent") as keyof typeof SUBSCRIPTION_TIERS;
        const tier = SUBSCRIPTION_TIERS[tierKey] || SUBSCRIPTION_TIERS.independent;
        estimatedSubscriptionMrrCents += tier.amountCents;
      } else {
        compedSubscriptions++;
      }
    }
  });

  const purchases = purchasesRes.data ?? [];
  const bookings = bookingsRes.data ?? [];

  return {
    activeSubscriptions,
    payingSubscriptions,
    compedSubscriptions,
    estimatedSubscriptionMrrCents,
    digitalSales30d: purchases.length,
    digitalSales30dGrossCents: purchases.reduce((sum, row) => sum + row.amount_cents, 0),
    lessonBookings30d: bookings.length,
    lessonVolume30dCents: bookings.reduce((sum, row) => sum + row.amount_cents, 0),
  };
}
