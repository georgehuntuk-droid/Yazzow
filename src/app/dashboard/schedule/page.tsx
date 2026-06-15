import { CalendarRange } from "lucide-react";

import { requireTutorProfile } from "@/lib/auth/session";
import { getSlotsForTutorOwner } from "@/lib/tutors/portal-data";
import { ScheduleEditor } from "@/components/dashboard/schedule-editor";
import { DashboardShell } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Schedule Builder · ${BRAND_NAME}`,
};

export default async function SchedulePage() {
  const { profile } = await requireTutorProfile();
  const slots = await getSlotsForTutorOwner(profile.id);

  return (
    <DashboardShell>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <CalendarRange className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Schedule Builder
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">
              Define the open time slots when families can book lessons on your portal
            </p>
          </div>
        </div>

        {/* Schedule Editor Card container */}
        <Card className="yazz-surface border-border/80 shadow-md">
          <CardContent className="p-6">
            <ScheduleEditor slots={slots} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
