import Link from "next/link";

import { PortalSettings } from "@/components/dashboard/portal-settings";
import { SubscriptionBillingPanel } from "@/components/dashboard/subscription-billing-panel";
import { DashboardShell, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireTutorProfile } from "@/lib/auth/session";
import { BRAND_NAME } from "@/lib/constants";
import { getPackagesForTutor } from "@/lib/tutors/queries";
import { getTutorSubscriptionState } from "@/lib/stripe/subscription";
import { isStripeConfigured } from "@/lib/stripe/server";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";

export const metadata = {
  title: `Portal settings · ${BRAND_NAME}`,
};

type PageProps = {
  searchParams: Promise<{ setup?: string; subscription?: string }>;
};

export default async function DashboardSettingsPage({ searchParams }: PageProps) {
  const { setup, subscription: subscriptionParam } = await searchParams;
  const showSetupNotice = setup === "true";
  const isSubscriptionSuccess = subscriptionParam === "active";
  const isSubscriptionCancelled = subscriptionParam === "cancelled";

  const { profile } = await requireTutorProfile();
  
  const [packages, subscription, configured, admin] = await Promise.all([
    getPackagesForTutor(profile.id),
    getTutorSubscriptionState(profile.id),
    Promise.resolve(isStripeConfigured()),
    isPlatformAdmin(),
  ]);

  return (
    <DashboardShell>
      <PageHeader
        title="Customize your portal"
        description="Photos, public link, lesson rate, and profile copy — everything parents see on your booking page."
        actions={
          <Button variant="outline" size="sm" render={<Link href="/dashboard" />}>
            Back to overview
          </Button>
        }
      />
      <div className="space-y-8">
        <SubscriptionBillingPanel 
          configured={configured} 
          subscription={subscription} 
          isAdmin={admin}
          isSuccess={isSubscriptionSuccess}
          isCancelled={isSubscriptionCancelled}
        />
        
        <div className="border-t border-border/40 pt-4">
          <PortalSettings profile={profile} initialPackages={packages} showSetupNotice={showSetupNotice} />
        </div>
      </div>
    </DashboardShell>
  );
}
