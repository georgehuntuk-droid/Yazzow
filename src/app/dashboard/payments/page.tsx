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

function stripeConfigHelpText(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const isLocal =
    process.env.NODE_ENV === "development" ||
    siteUrl.includes("localhost") ||
    siteUrl.includes("127.0.0.1");

  if (isLocal) {
    return "Add STRIPE_SECRET_KEY to .env.local, then restart the dev server (npm run dev).";
  }

  return "Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Netlify → Environment variables, scope All, then Deploys → Clear cache and deploy site.";
}

type PaymentsPageProps = {
  searchParams: Promise<{ subscription?: string; connected?: string }>;
};

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const query = await searchParams;
  const isSubscriptionSuccess = query.subscription === "active";
  const isSubscriptionCancelled = query.subscription === "cancelled";

  const { profile } = await requireTutorProfile();
  const configured = isStripeConfigured();
  const configHelpText = stripeConfigHelpText();

  const [row, admin, subscription] = await Promise.all([
    createClient().then(async (s) => {
      const { data } = await s
        .from("tutor_profiles")
        .select("stripe_account_id")
        .eq("id", profile.id)
        .maybeSingle();
      return data;
    }),
    isPlatformAdmin(),
    getTutorSubscriptionState(profile.id),
  ]);

  // Only make the slow Stripe Connect API call if they are subscribed and configured!
  // This speeds up the checkout onboarding flow significantly.
  const [status, platformStats] = await Promise.all([
    configured && subscription.active ? getConnectStatus(row?.stripe_account_id) : Promise.resolve(null),
    admin ? getPlatformRevenueStats() : Promise.resolve(null),
  ]);

  return (
    <DashboardShell>
      <PageHeader
        title="Payments & billing"
        description="Step 1: subscribe to Yazzow. Step 2 (optional): connect Stripe when you want parents to pay for lessons on your portal."
      />
      <div className="space-y-6">
        {admin && platformStats ? <PlatformRevenuePanel stats={platformStats} /> : null}
        
        <SubscriptionBillingPanel 
          configured={configured} 
          subscription={subscription} 
          isAdmin={admin}
          isSuccess={isSubscriptionSuccess}
          isCancelled={isSubscriptionCancelled}
        />
        
        {subscription.active ? (
          <>
            <StripeConnectPanel
              configured={configured}
              status={status}
              configHelpText={configHelpText}
            />
            <FeeSummary tutorId={profile.id} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            After you subscribe, you can optionally connect Stripe payouts to accept paid lesson
            bookings. Worksheet packs on your shelf never need Connect.
          </p>
        )}
      </div>
    </DashboardShell>
  );
}
