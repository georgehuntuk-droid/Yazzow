import { StripeConnectPanel } from "@/components/dashboard/stripe-connect-panel";
import { SubscriptionBillingPanel } from "@/components/dashboard/subscription-billing-panel";
import { FeeSummary } from "@/components/dashboard/fee-summary";
import { PlatformRevenuePanel } from "@/components/dashboard/platform-revenue-panel";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { getPlatformRevenueStats } from "@/lib/platform/revenue";
import { DashboardShell, PageHeader } from "@/components/layout/page-header";
import { requireTutorProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getConnectStatus } from "@/lib/stripe/connect";
import { isStripeConfigured } from "@/lib/stripe/server";
import { getTutorSubscriptionState } from "@/lib/stripe/subscription";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Payments · ${BRAND_NAME}`,
};

export default async function PaymentsPage() {
  const { profile } = await requireTutorProfile();
  const configured = isStripeConfigured();

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("tutor_profiles")
    .select("stripe_account_id")
    .eq("id", profile.id)
    .single();

  const admin = await isPlatformAdmin();
  const [status, subscription, platformStats] = await Promise.all([
    configured ? getConnectStatus(row?.stripe_account_id) : Promise.resolve(null),
    getTutorSubscriptionState(profile.id),
    admin ? getPlatformRevenueStats() : Promise.resolve(null),
  ]);

  return (
    <DashboardShell>
      <PageHeader
        title="Payments & billing"
        description="Subscribe to run your portal, connect Stripe for payouts, and sell worksheets with a small per-sale fee."
      />
      <div className="space-y-6">
        {admin && platformStats ? <PlatformRevenuePanel stats={platformStats} /> : null}
        <SubscriptionBillingPanel configured={configured} subscription={subscription} />
        <StripeConnectPanel configured={configured} status={status} />
        <FeeSummary tutorId={profile.id} />
      </div>
    </DashboardShell>
  );
}
