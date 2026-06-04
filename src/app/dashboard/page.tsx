import { Suspense } from "react";
import Link from "next/link";

import { CalendarSyncPanel } from "@/components/dashboard/calendar-sync-panel";
import { ScheduleEditor } from "@/components/dashboard/schedule-editor";
import { DigitalSalesLedger } from "@/components/dashboard/digital-sales-ledger";
import { PortalBookingStatusCard } from "@/components/dashboard/portal-booking-status-card";
import { StorefrontManager } from "@/components/dashboard/storefront-manager";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { StudentLedger } from "@/components/dashboard/student-ledger";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { requireTutorProfile } from "@/lib/auth/session";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DashboardShell, PageHeader } from "@/components/layout/page-header";
import { BRAND_NAME, TUTOR_SUBSCRIPTION, tutorPublicUrl } from "@/lib/constants";
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
        description="Share your portal link — parents join your group and book lessons. List worksheet packs on your shelf for parents to enquire. Customize your page under Portal."
        actions={
          <>
            <CopyLinkButton url={publicLink} size="sm" />
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

      <div className="mb-8 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground flex items-center justify-between gap-4 flex-wrap">
        <span>
          Public URL:{" "}
          <code className="font-medium text-foreground">{publicLink}</code>
        </span>
        <CopyLinkButton url={publicLink} variant="outline" size="sm" className="bg-background shadow-sm" />
      </div>

      {!portalBooking.subscriptionActive ? (
        <div className="mb-8 rounded-xl border border-amber-200/70 bg-amber-50/50 px-4 py-4 dark:bg-amber-950/25">
          <p className="font-medium text-foreground">Subscribe to turn on paid online booking</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your portal works for worksheets and your schedule, but parents cannot pay for lessons
            until you complete {TUTOR_SUBSCRIPTION.label} billing.
          </p>
          <Button size="sm" className="mt-3" render={<Link href="/dashboard/payments#subscription" />}>
            Subscribe in Payments
          </Button>
        </div>
      ) : null}

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
          Upload packs to showcase on your portal shelf. Parents message you to buy — you handle
          payment yourself (bank transfer, your own link, etc.). No extra Stripe setup for packs.
        </p>
        <StorefrontManager resources={resources} currency={profile.currency} />
        {packSales.length > 0 ? (
          <DigitalSalesLedger sales={packSales} currency={profile.currency} />
        ) : null}
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
