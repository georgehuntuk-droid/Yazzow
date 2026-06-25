import { CalendarRange, Calendar, Settings } from "lucide-react";

import { requireTutorProfile } from "@/lib/auth/session";
import { getSlotsForTutorOwner } from "@/lib/tutors/portal-data";
import { ScheduleEditor } from "@/components/dashboard/schedule-editor";
import { WeeklyScheduleSettings } from "@/components/dashboard/weekly-schedule-settings";
import { DashboardShell } from "@/components/layout/page-header";
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
        </div>

        {/* Combined Side-by-Side Schedule Builder Grid */}
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] items-start">
          {/* Left Column: Interactive Calendar */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Calendar className="size-4.5 text-primary" />
              1. Interactive Calendar (Slots)
            </h2>
            <ScheduleEditor slots={slots} />
          </div>

          {/* Right Column: Weekly Standard Hours & Bulk generation */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Settings className="size-4.5 text-primary" />
              2. Standard Hours Rules
            </h2>
            <WeeklyScheduleSettings />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
