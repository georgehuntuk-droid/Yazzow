import Link from "next/link";
import { Globe, Settings, Sparkles, CalendarRange } from "lucide-react";
import { InstallAppButton } from "@/components/pwa/install-app-button";

import { PortalBookingStatusCard } from "@/components/dashboard/portal-booking-status-card";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { TutorStatsMatrix } from "@/components/dashboard/tutor-stats-matrix";
import { DashboardActivityTimeline } from "@/components/dashboard/dashboard-activity-timeline";
import { requireTutorProfile } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/page-header";
import { BRAND_NAME, TUTOR_SUBSCRIPTION, tutorPublicUrl } from "@/lib/constants";
import { getPortalBookingStatus } from "@/lib/tutors/portal-booking-status";
import {
  getDigitalSalesForTutor,
  getRecentBookingsForTutor,
  getSlotsForTutorOwner,
} from "@/lib/tutors/portal-data";
import { getStudentsWithLessonsForTutor } from "@/lib/tutors/student-lessons";

export const metadata = {
  title: `Dashboard · ${BRAND_NAME}`,
};

export default async function DashboardPage() {
  const { profile } = await requireTutorProfile();
  const publicLink = tutorPublicUrl(profile.username);
  const [slots, studentGroups, recentBookings, packSales, portalBooking] =
    await Promise.all([
      getSlotsForTutorOwner(profile.id),
      getStudentsWithLessonsForTutor(profile.id),
      getRecentBookingsForTutor(profile.id),
      getDigitalSalesForTutor(profile.id),
      getPortalBookingStatus(profile.id),
    ]);

  // Calculate actual tutor statistics for our stunning matrix component
  const bookingEarnings = recentBookings.reduce((sum, b) => sum + (b.amountCents || 0), 0);
  const digitalEarnings = packSales.reduce((sum, s) => sum + (s.amountCents || 0), 0);
  const totalEarningsCents = bookingEarnings + digitalEarnings;

  const totalOwedCents = [...studentGroups.active, ...studentGroups.archived].reduce(
    (sum, student) => sum + (student.owedAmountCents || 0),
    0
  );
  
  const activeStudentsCount = studentGroups.active.length;
  const openSlotsCount = slots.filter((s) => !s.isBooked && new Date(s.startsAt) > new Date()).length;
  const rawFirst = profile.displayName.trim().split(/[\s\._]+/)[0] || "there";
  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);

  return (
    <DashboardShell>
      <div className="space-y-8 pb-12">
        {/* Top Header Row with Profile Quick View */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-black tracking-tight text-foreground selection:bg-blue-100 flex items-center gap-2">
              Hello {firstName}
              <Sparkles className="size-5 text-primary animate-pulse" />
            </h1>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening with your students today.
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <CopyLinkButton url={publicLink} size="sm" className="shadow-sm" />
            <InstallAppButton size="sm" variant="outline" />
            <Button size="sm" render={<Link href={`/tutor/${profile.username}`} target="_blank" className="gap-1.5" />}>
              <Globe className="size-4" />
              Preview Portal
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/dashboard/settings" className="gap-1.5" />}>
              <Settings className="size-4 text-primary" />
              Settings
            </Button>
          </div>
        </div>

        {/* 1. Quick Info Link Bar */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/20 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-foreground">
              Your Portal is Live: <code className="ml-1 text-primary">{publicLink}</code>
            </span>
          </div>
          <CopyLinkButton url={publicLink} variant="outline" size="sm" className="self-start sm:self-auto bg-background text-[11px] font-bold" />
        </div>

        {/* 2. Billing subscription card if not active */}
        {!portalBooking.subscriptionActive ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
            <p className="font-black text-foreground flex items-center gap-1.5 text-sm sm:text-base">
              Activate Online Booking Checkout
            </p>
            <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
              Your schedule is open, but families cannot checkout lessons online until you complete {TUTOR_SUBSCRIPTION.label} billing.
            </p>
            <Button size="sm" className="mt-3.5" render={<Link href="/dashboard/payments#subscription" />}>
              Subscribe in Payments
            </Button>
          </div>
        ) : null}

        {/* 3. The Gorgeous Tutor Stats Matrix Section */}
        <TutorStatsMatrix
          activeStudents={activeStudentsCount}
          openSlots={openSlotsCount}
          totalEarningsCents={totalEarningsCents}
          completedSessions={recentBookings.length}
          currency={profile.currency}
          owedEarningsCents={totalOwedCents}
          recentBookings={recentBookings}
          digitalSales={packSales}
        />

        {/* 4. Bookings & Activities Two-Column Grid */}
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section id="bookings" className="scroll-mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                <CalendarRange className="size-5 text-primary" />
                Upcoming Bookings
              </h2>
              <span className="rounded-full bg-blue-100/60 px-2.5 py-0.5 text-xs font-bold text-primary">
                {recentBookings.length} bookings
              </span>
            </div>
            <PortalBookingStatusCard status={portalBooking} />
            <RecentBookings bookings={recentBookings} currency={profile.currency} />
          </section>

          <section id="activity" className="scroll-mt-8">
            <DashboardActivityTimeline 
              currency={profile.currency} 
              lessonPriceCents={profile.lessonPriceCents} 
            />
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
