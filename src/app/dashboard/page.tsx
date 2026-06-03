import { Suspense } from "react";
import Link from "next/link";

import { CalendarSyncPanel } from "@/components/dashboard/calendar-sync-panel";
import { ScheduleEditor } from "@/components/dashboard/schedule-editor";
import { DigitalSalesLedger } from "@/components/dashboard/digital-sales-ledger";
import { PortalBookingStatusCard } from "@/components/dashboard/portal-booking-status-card";
import { StorefrontManager } from "@/components/dashboard/storefront-manager";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { StudentLedger } from "@/components/dashboard/student-ledger";
import { requireTutorProfile } from "@/lib/auth/session";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DashboardShell, PageHeader } from "@/components/layout/page-header";
import { BRAND_NAME, PLATFORM_FEES, tutorPublicUrl } from "@/lib/constants";
import { getPortalBookingStatus } from "@/lib/tutors/portal-booking-status";
import {
  getDigitalSalesForTutor,
  getRecentBookingsForTutor,
  getResourcesForTutorOwner,
  getSlotsForTutorOwner,
} from "@/lib/tutors/portal-data";
import { getStudentsWithLessonsForTutor } from "@/lib/tutors/student-lessons";
import { getTutorCalendarSettings } from "@/lib/calendar/queries";
import { isGoogleCalendarConfigured } from "@/lib/calendar/google";
import { formatMoney } from "@/lib/format";

export const metadata = {
  title: `Dashboard · ${BRAND_NAME}`,
};

export default async function DashboardPage() {
  const { profile } = await requireTutorProfile();
  const publicLink = tutorPublicUrl(profile.username);
  const [slots, resources, studentGroups, calendarSettings, recentBookings, packSales, portalBooking] =
    await Promise.all([
      getSlotsForTutorOwner(profile.id),
      getResourcesForTutorOwner(profile.id),
      getStudentsWithLessonsForTutor(profile.id),
      getTutorCalendarSettings(profile.id),
      getRecentBookingsForTutor(profile.id),
      getDigitalSalesForTutor(profile.id),
      getPortalBookingStatus(profile.id),
    ]);

  return (
    <DashboardShell>
      <PageHeader
        title={`Welcome, ${profile.displayName}`}
        description="Share your portal link — parents join your group, then book and buy packs. Customize your page under Portal."
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
          { label: "Active students", value: String(studentGroups.active.length) },
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

      <section id="bookings" className="scroll-mt-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold">Bookings</h2>
        <PortalBookingStatusCard status={portalBooking} />
        <RecentBookings bookings={recentBookings} currency={profile.currency} />
      </section>

      <Separator className="my-10" />

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
        <h2 className="font-heading text-xl font-semibold">Learning packs</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Upload worksheets here. Sales are tracked below with the{" "}
          {PLATFORM_FEES.digitalGoodsPercent}% platform fee shown on each line. Your{" "}
          {BRAND_NAME} subscription is separate — it is not taken from lesson or pack payouts.
        </p>
        <StorefrontManager resources={resources} currency={profile.currency} />
        <DigitalSalesLedger sales={packSales} currency={profile.currency} />
      </section>

      <Separator className="my-10" />

      <section id="ledger" className="scroll-mt-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold">Students</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Track each family, add optional lesson feedback when you want, archive students who
          have left, or restore them if they return.
        </p>
        <StudentLedger
          students={studentGroups}
          currency={profile.currency}
        />
      </section>
    </DashboardShell>
  );
}
