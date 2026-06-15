import { BookOpen } from "lucide-react";

import { requireTutorProfile } from "@/lib/auth/session";
import { getResourcesForTutorOwner, getDigitalSalesForTutor } from "@/lib/tutors/portal-data";
import { StorefrontManager } from "@/components/dashboard/storefront-manager";
import { DigitalSalesLedger } from "@/components/dashboard/digital-sales-ledger";
import { DashboardShell } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Shop Manager · ${BRAND_NAME}`,
};

export default async function StorefrontPage() {
  const { profile } = await requireTutorProfile();
  const resources = await getResourcesForTutorOwner(profile.id);
  const packSales = await getDigitalSalesForTutor(profile.id);

  return (
    <DashboardShell>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <BookOpen className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Shop Manager
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">
              Upload and organize digital learning packages for your storefront shelf
            </p>
          </div>
        </div>

        {/* Informational banner */}
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-4">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
            Upload files, specify subjects/grades, and set pricing. Published items are instantly visible on your public storefront. Families buy directly from you with zero platform commission.
          </p>
        </div>

        {/* Storefront Manager Card container */}
        <Card className="yazz-surface border-border/80 shadow-md">
          <CardContent className="p-6">
            <StorefrontManager resources={resources} currency={profile.currency} />
          </CardContent>
        </Card>

        {/* Sales Ledger if there are sales */}
        {packSales.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="font-heading text-lg font-black tracking-tight text-foreground">
              Sales Ledger
            </h2>
            <Card className="yazz-surface border-border/80 shadow-md">
              <CardContent className="p-6">
                <DigitalSalesLedger sales={packSales} currency={profile.currency} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
