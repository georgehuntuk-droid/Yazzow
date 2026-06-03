import { StripeConnectPanel } from "@/components/dashboard/stripe-connect-panel";
import { FeeSummary } from "@/components/dashboard/fee-summary";
import { DashboardShell, PageHeader } from "@/components/layout/page-header";
import { requireTutorProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getConnectStatus } from "@/lib/stripe/connect";
import { isStripeConfigured } from "@/lib/stripe/server";
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

  const status = configured
    ? await getConnectStatus(row?.stripe_account_id)
    : null;

  return (
    <DashboardShell>
      <PageHeader
        title="Payments & payouts"
        description="Connect Stripe once. Platform fees are taken automatically on each checkout — no weekly invoices."
      />
      <div className="space-y-6">
        <StripeConnectPanel configured={configured} status={status} />
        <FeeSummary tutorId={profile.id} />
      </div>
    </DashboardShell>
  );
}
