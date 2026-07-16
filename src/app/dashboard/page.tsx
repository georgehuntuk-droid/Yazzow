import Link from "next/link";
import { Globe, Settings, Sparkles, CalendarRange, Megaphone } from "lucide-react";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { PushPromptBanner } from "@/components/pwa/push-prompt-banner";

import { PortalBookingStatusCard } from "@/components/dashboard/portal-booking-status-card";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { TutorStatsMatrix } from "@/components/dashboard/tutor-stats-matrix";
import { DashboardActivityTimeline } from "@/components/dashboard/dashboard-activity-timeline";
import { requireTutorProfile } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/page-header";
import { BRAND_NAME, tutorPublicUrl } from "@/lib/constants";
import { getTutorSubscriptionState, type TutorSubscriptionState } from "@/lib/stripe/subscription";
import { getPortalBookingStatus } from "@/lib/tutors/portal-booking-status";
import {
  getDigitalSalesForTutor,
  getRecentBookingsForTutor,
  getSlotsForTutorOwner,
  getRecentMessagesForTutor,
  getTutorAverageRating,
  getLatestAdminNotices,
} from "@/lib/tutors/portal-data";
import { getStudentsWithLessonsForTutor } from "@/lib/tutors/student-lessons";

export const metadata = {
  title: `Dashboard · ${BRAND_NAME}`,
};

export default async function DashboardPage() {
  const { profile } = await requireTutorProfile();
  const publicLink = tutorPublicUrl(profile.username);

  let slots: any[] = [];
  let studentGroups: any = { active: [], archived: [], pending: [] };
  let recentBookings: any[] = [];
  let packSales: any[] = [];
  let portalBooking: any = { canAcceptBookings: false, subscriptionActive: false };
  let recentMessages: any[] = [];
  let tutorRating: any = { averageRating: 0, ratingCount: 0 };
  let notices: any[] = [];
  let subState: any = { subscriptionTier: "independent" };

  const subStateRes = await getTutorSubscriptionState(profile.id).catch((err) => {
    console.error("Error in getTutorSubscriptionState:", err);
    return {
      status: null,
      currentPeriodEnd: null,
      active: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTrackingUnavailable: false,
      cancelAtPeriodEnd: false,
      subscriptionTier: "independent",
    } as TutorSubscriptionState;
  });

  try {
    const [
      slotsRes,
      studentGroupsRes,
      recentBookingsRes,
      packSalesRes,
      portalBookingRes,
      recentMessagesRes,
      tutorRatingRes,
      noticesRes,
    ] = await Promise.all([
      getSlotsForTutorOwner(profile.id).catch((err) => {
        console.error("Error in getSlotsForTutorOwner:", err);
        return [];
      }),
      getStudentsWithLessonsForTutor(profile.id, { skipAuthCheck: true }).catch((err) => {
        console.error("Error in getStudentsWithLessonsForTutor:", err);
        return { active: [], archived: [], pending: [] };
      }),
      getRecentBookingsForTutor(profile.id).catch((err) => {
        console.error("Error in getRecentBookingsForTutor:", err);
        return [];
      }),
      getDigitalSalesForTutor(profile.id).catch((err) => {
        console.error("Error in getDigitalSalesForTutor:", err);
        return [];
      }),
      getPortalBookingStatus(profile.id, { subscriptionState: subStateRes }).catch((err) => {
        console.error("Error in getPortalBookingStatus:", err);
        return { canAcceptBookings: false, subscriptionActive: false };
      }),
      getRecentMessagesForTutor(profile.id).catch((err) => {
        console.error("Error in getRecentMessagesForTutor:", err);
        return [];
      }),
      getTutorAverageRating(profile.id).catch((err) => {
        console.error("Error in getTutorAverageRating:", err);
        return { averageRating: 0, ratingCount: 0 };
      }),
      getLatestAdminNotices(2).catch((err) => {
        console.error("Error in getLatestAdminNotices:", err);
        return [];
      }),
    ]);

    slots = slotsRes;
    studentGroups = studentGroupsRes;
    recentBookings = recentBookingsRes;
    packSales = packSalesRes;
    portalBooking = portalBookingRes;
    recentMessages = recentMessagesRes;
    tutorRating = tutorRatingRes;
    notices = noticesRes;
    subState = subStateRes;
  } catch (err) {
    console.error("Failed to execute Promise.all in dashboard page:", err);
  }

  const allStudents = [
    ...studentGroups.active,
    ...studentGroups.archived,
    ...studentGroups.pending,
  ];
  const hasStudents = allStudents.length > 0;

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
  const displayName = (profile.displayName || "there").trim();

  return (
    <DashboardShell>
      <div className="space-y-8 pb-12">
        {/* Web Push Onboarding Prompt */}
        <PushPromptBanner role="tutor" userId={profile.id} />

        {/* Top Header Row with Profile Quick View */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-black tracking-tight text-foreground selection:bg-blue-100 flex items-center gap-2">
              Hello {displayName}
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

        {(() => {
          const rawTier = subState?.subscriptionTier || "growth";
          const { SUBSCRIPTION_TIERS } = require("@/lib/constants");
          const tier =
            rawTier === "agency"
              ? "academy"
              : rawTier === "independent"
              ? "growth"
              : rawTier;
          const config = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.growth;
          
          let badgeText = "📈 Growth Member";
          let badgeColor = "bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-400 font-bold";
          
          if (tier === "academy") {
            badgeText = "🏫 The Academy Member";
            badgeColor = "bg-yellow-500/10 border-yellow-500/25 text-yellow-700 dark:text-yellow-400 font-extrabold";
          } else if (tier === "starter") {
            badgeText = "🌱 Starter Member";
            badgeColor = "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-semibold";
          }
          
          return (
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-black text-foreground flex items-center gap-2 text-sm sm:text-base">
                  <span>Membership Rank:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                    {badgeText}
                  </span>
                </p>
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Active Students: <strong className="text-foreground">{activeStudentsCount}</strong> / {config.maxStudents ? config.maxStudents : "Unlimited"}
                  {" · "}
                  {config.maxStudents 
                    ? `Your plan allows up to ${config.maxStudents} active students. Upgrade if you need more.`
                    : "Enjoy unlimited active students, custom branding, and team management tools!"}
                </p>
              </div>
              <Button size="sm" render={<Link href="/dashboard/payments#subscription" />}>
                View / Upgrade Plan
              </Button>
            </div>
          );
        })()}

        {/* Notice Board Announcements Feed */}
        {notices && notices.length > 0 && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden space-y-4">
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="size-4 animate-bounce" />
              Platform Announcements & New Features
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {notices.map((notice) => (
                <div key={notice.id} className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 rounded-full bg-primary/5 blur-lg pointer-events-none" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {(() => {
                      if (!notice.created_at) return "—";
                      const d = new Date(notice.created_at);
                      if (isNaN(d.getTime())) return "—";
                      return d.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      });
                    })()}
                  </span>
                  <h3 className="text-sm font-black text-foreground mt-1">{notice.title}</h3>
                  <p className="text-xs font-medium text-muted-foreground mt-1.5 leading-relaxed whitespace-pre-wrap">
                    {notice.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Billing subscription card if not active */}
        {!portalBooking.subscriptionActive ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
            <p className="font-black text-foreground flex items-center gap-1.5 text-sm sm:text-base">
              Activate Online Booking Checkout
            </p>
            <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
              Your schedule is open, but families cannot checkout lessons online until you choose a subscription plan in Payments.
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
          hasStudents={hasStudents}
          averageRating={tutorRating.averageRating}
          ratingCount={tutorRating.ratingCount}
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
              hasStudents={hasStudents}
              students={allStudents.map(s => ({
                id: s.id,
                studentName: s.studentName,
                parentEmail: s.parentEmail,
                createdAt: s.createdAt,
              }))}
              messages={recentMessages}
            />
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
