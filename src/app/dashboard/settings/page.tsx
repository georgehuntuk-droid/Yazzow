import Link from "next/link";

import { PortalSettings } from "@/components/dashboard/portal-settings";
import { DashboardShell, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireTutorProfile } from "@/lib/auth/session";
import { BRAND_NAME } from "@/lib/constants";
import { getPackagesForTutor } from "@/lib/tutors/queries";

export const metadata = {
  title: `Portal settings · ${BRAND_NAME}`,
};

export default async function DashboardSettingsPage() {
  const { profile } = await requireTutorProfile();
  const packages = await getPackagesForTutor(profile.id);

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
      <PortalSettings profile={profile} initialPackages={packages} />
    </DashboardShell>
  );
}
