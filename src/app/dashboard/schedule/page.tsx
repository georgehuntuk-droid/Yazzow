import { CalendarRange, Calendar, Settings } from "lucide-react";

import { requireTutorProfile } from "@/lib/auth/session";
import { getSlotsForTutorOwner } from "@/lib/tutors/portal-data";
import { ScheduleEditor } from "@/components/dashboard/schedule-editor";
import { WeeklyScheduleSettings } from "@/components/dashboard/weekly-schedule-settings";
import { DashboardShell } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

        {/* Tabbed view for calendar / standard hours */}
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="h-11 w-full justify-start rounded-xl bg-muted/60 p-1 sm:w-auto mb-6">
            <TabsTrigger value="calendar" className="rounded-lg px-4 gap-1.5 text-xs sm:text-sm">
              <Calendar className="size-4 text-primary" />
              Interactive Calendar
            </TabsTrigger>
            <TabsTrigger value="standard" className="rounded-lg px-4 gap-1.5 text-xs sm:text-sm">
              <Settings className="size-4 text-primary" />
              Weekly Standard Hours
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="mt-0">
            <ScheduleEditor slots={slots} />
          </TabsContent>
          
          <TabsContent value="standard" className="mt-0">
            <WeeklyScheduleSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
