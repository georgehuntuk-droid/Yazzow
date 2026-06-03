import "server-only";

import { TUTOR_SUBSCRIPTION } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriptionActive } from "@/lib/stripe/subscription";

export type PlatformRevenueStats = {
  activeSubscriptions: number;
  estimatedSubscriptionMrrCents: number;
  digitalSales30d: number;
  digitalPlatformFees30d: number;
  lessonBookings30d: number;
  lessonVolume30dCents: number;
};

export async function getPlatformRevenueStats(): Promise<PlatformRevenueStats> {
  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [tutorsRes, purchasesRes, bookingsRes] = await Promise.all([
    admin.from("tutor_profiles").select("subscription_status"),
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

  const activeSubscriptions = (tutorsRes.data ?? []).filter((row) =>
    isSubscriptionActive(row.subscription_status),
  ).length;

  const purchases = purchasesRes.data ?? [];
  const bookings = bookingsRes.data ?? [];

  return {
    activeSubscriptions,
    estimatedSubscriptionMrrCents:
      activeSubscriptions * TUTOR_SUBSCRIPTION.amountCents,
    digitalSales30d: purchases.length,
    digitalPlatformFees30d: purchases.reduce(
      (sum, row) => sum + row.platform_fee_cents,
      0,
    ),
    lessonBookings30d: bookings.length,
    lessonVolume30dCents: bookings.reduce((sum, row) => sum + row.amount_cents, 0),
  };
}
