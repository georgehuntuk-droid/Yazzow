import { Suspense } from "react";
import Link from "next/link";

import { CalendarSyncPanel } from "@/components/dashboard/calendar-sync-panel";
import { ScheduleEditor } from "@/components/dashboard/schedule-editor";
import { StorefrontManager } from "@/components/dashboard/storefront-manager";
import { StudentLedger } from "@/components/dashboard/student-ledger";
import { requireTutorProfile } from "@/lib/auth/session";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DashboardShell, PageHeader } from "@/components/layout/page-header";
import { BRAND_NAME, tutorPublicUrl } from "@/lib/constants";
import {
  getResourcesForTutorOwner,
  getSlotsForTutorOwner,
  getStudentsForTutor,
} from "@/lib/tutors/portal-data";
import { getTutorCalendarSettings } from "@/lib/calendar/queries";
import { isGoogleCalendarConfigured } from "@/lib/calendar/google";
import { formatMoney } from "@/lib/format";

export const metadata = {
  title: `Dashboard · ${BRAND_NAME}`,
};

export default async function DashboardPage() {
  const { profile } = await requireTutorProfile();
  const publicLink = tutorPublicUrl(profile.username);
  const [slots, resources, students, calendarSettings] = await Promise.all([
    getSlotsForTutorOwner(profile.id),
    getResourcesForTutorOwner(profile.id),
    getStudentsForTutor(profile.id),
    getTutorCalendarSettings(profile.id),
  ]);

  return (
    <DashboardShell>
      <PageHeader
        title={`Welcome, ${profile.displayName}`}
        description="Your private business home — share your portal link, manage bookings, and track students."
        actions={
          <>
            <Button variant="outline" size="sm" render={<Link href="/dashboard/settings" />}>
              Customize portal
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/dashboard/payments" />}>
              Payments
            </Button>
            <Button size="sm" render={<Link href={`/tutor/${profile.username}`} />}>
              Preview portal
            </Button>
          </>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Portal link", value: profile.username, hint: "Share with parents" },
          { label: "Lesson rate", value: formatMoney(profile.lessonPriceCents, profile.currency) },
          { label: "Students", value: String(students.length) },
        ].map((stat) => (
          <Card key={stat.label} className="yazz-panel">
            <CardContent className="pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold">{stat.value}</p>
              {stat.hint ? <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mb-8 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Public URL:{" "}
        <code className="font-medium text-foreground">{publicLink}</code>
      </p>

      <section id="schedule" className="scroll-mt-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold">Schedule builder</h2>
        <ScheduleEditor slots={slots} />
        <Suspense fallback={null}>
          <CalendarSyncPanel
            settings={calendarSettings}
            googleConfigured={isGoogleCalendarConfigured()}
          />
        </Suspense>
      </section>

      <Separator className="my-10" />

      <section id="storefront" className="scroll-mt-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold">Your portal</h2>
        <StorefrontManager resources={resources} currency={profile.currency} />
      </section>

      <Separator className="my-10" />

      <section id="ledger" className="scroll-mt-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold">Student ledger</h2>
        <StudentLedger students={students} />
      </section>
    </DashboardShell>
  );
}
