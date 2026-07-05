import { Suspense } from "react";
import { notFound } from "next/navigation";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { BookingCalendar } from "@/components/tutor/booking-calendar";
import { BookingCalendarLive } from "@/components/tutor/booking-calendar-live";
import { BookingStatusBanner } from "@/components/tutor/booking-status-banner";
import { JoinTutorFamily } from "@/components/tutor/join-tutor-family";
import { PortalThemeWrapper } from "@/components/tutor/portal-theme-wrapper";
import { PublicProfile } from "@/components/tutor/public-profile";
import { ResourceShelf } from "@/components/tutor/resource-shelf";
import { LessonPackagesTab } from "@/components/tutor/lesson-packages-tab";
import { CurrencySelector } from "@/components/brand/currency-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEMO_OPEN_SLOTS,
  DEMO_RESOURCES,
  getDemoTutorByUsername,
} from "@/lib/demo-data";
import { fulfillLessonBookingFromCheckoutSessionId } from "@/lib/stripe/fulfill-lesson-booking";
import { bookingManageUrl as buildBookingManageUrl } from "@/lib/bookings/manage-token";
import { isStripeConfigured } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TutorProfileRow } from "@/lib/supabase/database.types";
import { getPortalBookingStatus } from "@/lib/tutors/portal-booking-status";
import { getTutorByUsername, getPackagesForTutor } from "@/lib/tutors/queries";
import {
  getOpenSlotsForTutor,
  getPublishedResourcesForTutor,
} from "@/lib/tutors/portal-data";

export const dynamic = "force-dynamic";

import { generateMetadata } from "./metadata";

export { generateMetadata };

type TutorPortalPageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    booked?: string;
    cancelled?: string;
    session_id?: string;
    package_booked?: string;
  }>;
};

const DEMO_USERNAMES = new Set(["demo", "maya-chen"]);

export default async function TutorPortalPage({ params, searchParams }: TutorPortalPageProps) {
  const { username } = await params;
  const query = await searchParams;

  const isSamplePortal = DEMO_USERNAMES.has(username);
  const [user, liveTutor] = await Promise.all([
    createClient().then((s) => s.auth.getUser().then((res) => res.data.user).catch(() => null)),
    isSamplePortal ? Promise.resolve(null) : getTutorByUsername(username),
  ]);

  let activeStudentsPromise = Promise.resolve<any[] | null>(null);
  if (user && liveTutor) {
    const admin = createAdminClient();
    activeStudentsPromise = Promise.resolve(
      admin
        .from("students")
        .select("student_name, parent_email")
        .eq("tutor_id", liveTutor.id)
        .eq("parent_email", user.email)
        .eq("status", "active")
        .then((res) => res.data)
    );
  }

  const demoTutor = isSamplePortal
    ? getDemoTutorByUsername(username)
    : !liveTutor
      ? getDemoTutorByUsername(username)
      : null;
  const tutor = liveTutor ?? demoTutor;

  if (!tutor || tutor.isBanned) {
    notFound();
  }

  let bookingManageUrl: string | null = null;

  if (liveTutor && query.session_id && isStripeConfigured()) {
    const admin = createAdminClient();
    const { data: tutorRow } = await admin
      .from("tutor_profiles")
      .select("stripe_account_id")
      .eq("id", liveTutor.id)
      .maybeSingle();

    const stripeAccountId = (tutorRow as Pick<TutorProfileRow, "stripe_account_id"> | null)
      ?.stripe_account_id;

    if (stripeAccountId) {
      if (query.booked === "1") {
        try {
          const fulfilled = await fulfillLessonBookingFromCheckoutSessionId(
            query.session_id,
            stripeAccountId,
          );
          if (fulfilled.ok && fulfilled.bookingId) {
            bookingManageUrl = buildBookingManageUrl(fulfilled.bookingId);
          }
        } catch (err) {
          console.error("Checkout return fulfillment failed:", err);
        }
      } else if (query.package_booked === "1") {
        try {
          const { fulfillPackageCheckoutFromCheckoutSessionId } = await import(
            "@/lib/stripe/fulfill-package"
          );
          await fulfillPackageCheckoutFromCheckoutSessionId(
            query.session_id,
            stripeAccountId,
          );
        } catch (err) {
          console.error("Package checkout return fulfillment failed:", err);
        }
      }
    }
  }

  const [activeStudents, slots, resources, packages, portalBooking] = await Promise.all([
    activeStudentsPromise,
    liveTutor ? getOpenSlotsForTutor(liveTutor.id) : Promise.resolve(DEMO_OPEN_SLOTS),
    liveTutor ? getPublishedResourcesForTutor(liveTutor.id) : Promise.resolve(DEMO_RESOURCES),
    liveTutor ? getPackagesForTutor(liveTutor.id) : Promise.resolve([]),
    liveTutor ? getPortalBookingStatus(liveTutor.id) : getPortalBookingStatus("", { isDemo: true }),
  ]);

  let connectedStudents: any[] = [];
  if (activeStudents) {
    connectedStudents = activeStudents.map((s) => ({
      studentName: s.student_name,
      parentEmail: s.parent_email,
    }));
  }

  const paymentsEnabled = portalBooking.canAcceptBookings;
  const paymentsBlockedReason =
    portalBooking.blockedReason === "subscription_inactive"
      ? "subscription"
      : portalBooking.blockedReason === "demo"
        ? "demo"
        : portalBooking.blockedReason
          ? "stripe"
          : undefined;
  const paymentsBlockedMessage = portalBooking.parentMessage;

  return (
    <PortalThemeWrapper tutor={tutor}>
    <div className="min-h-full">
      {tutor.portalAnnouncementActive && tutor.portalAnnouncement && (() => {
        if (tutor.portalAnnouncementUpdatedAt && tutor.portalAnnouncementDurationHours && tutor.portalAnnouncementDurationHours > 0) {
          const updatedTime = new Date(tutor.portalAnnouncementUpdatedAt).getTime();
          const elapsedHours = (Date.now() - updatedTime) / (1000 * 60 * 60);
          if (elapsedHours > tutor.portalAnnouncementDurationHours) return false;
        }
        return true;
      })() ? (
        <div className="bg-primary px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-primary-foreground select-none relative animate-in slide-in-from-top-full duration-300 whitespace-normal break-words">
          <div className="max-w-5xl mx-auto w-full px-2 sm:px-4 break-words whitespace-normal leading-normal">
            📢 {tutor.portalAnnouncement}
          </div>
        </div>
      ) : null}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="yazz-container flex h-16 max-w-5xl items-center justify-between gap-2 sm:gap-4">
          <Logo size="header" href="/" iconOnly={true} className="inline-flex sm:hidden shrink-0" />
          <Logo size="header" href="/" iconOnly={false} className="hidden sm:inline-flex shrink-0" />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <CurrencySelector tutorCurrency={tutor.currency} />
            {isSamplePortal ? (
              <>
                <p className="hidden rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs text-muted-foreground md:block">
                  Sample portal · preview only
                </p>
                <nav className="flex shrink-0 items-center gap-2">
                  <Link
                    href="/auth/login?next=/tutor/demo"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className={buttonVariants({ variant: "default", size: "sm" })}
                  >
                    Get started
                  </Link>
                </nav>
              </>
            ) : (
              <nav className="flex items-center gap-1 sm:gap-2">
                {user ? (
                  <Link
                    href={`/tutor/${username}/workspace`}
                    className={buttonVariants({ variant: "default", size: "sm" }) + " font-bold text-[10px] sm:text-xs rounded-xl shadow-sm px-2.5 sm:px-3 h-8 sm:h-9 shrink-0"}
                  >
                    Open Workspace
                  </Link>
                ) : (
                  <Link
                    href={`/auth/login?next=/tutor/${username}/workspace`}
                    className={buttonVariants({ variant: "outline", size: "sm" }) + " font-bold text-[10px] sm:text-xs rounded-xl hover:bg-muted transition-colors px-2.5 sm:px-3 h-8 sm:h-9 shrink-0"}
                  >
                    Parent Login
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </header>

      <main className="yazz-container max-w-5xl py-8 sm:py-10">
        <Suspense fallback={null}>
          <BookingStatusBanner manageUrl={bookingManageUrl} />
        </Suspense>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px] min-w-0 w-full">
          {/* Main Area */}
          <div className="space-y-8 min-w-0 w-full">
            <PublicProfile tutor={tutor} />

            {/* Mobile/Tablet Placement: Join Group / Portal Signup (Hidden on desktop) */}
            {liveTutor && tutor.allowPublicJoining !== false ? (
              <div className="lg:hidden">
                <JoinTutorFamily
                  tutor={tutor}
                  tutorUsername={username}
                  currentUserEmail={user?.email}
                  connectedStudents={connectedStudents}
                />
              </div>
            ) : null}

            <Tabs defaultValue="book">
              <TabsList className="h-11 w-full justify-start rounded-xl bg-muted/60 p-1 sm:w-auto overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-none">
                <TabsTrigger value="book" className="rounded-lg px-4">
                  Book a lesson
                </TabsTrigger>
                <TabsTrigger value="packages" className="rounded-lg px-4">
                  Lesson packages
                </TabsTrigger>
                <TabsTrigger value="shelf" className="rounded-lg px-4">
                  The shelf
                </TabsTrigger>
              </TabsList>
              <TabsContent value="book" className="mt-6">
                {slots.filter((s) => s.available).length === 0 ? (
                  <div className="yazz-panel px-6 py-14 text-center text-muted-foreground">
                    No open slots right now. Check back soon or message your tutor directly.
                  </div>
                ) : liveTutor ? (
                  <BookingCalendarLive
                    tutor={tutor}
                    tutorUsername={username}
                    initialSlots={slots.filter((s) => s.available)}
                    paymentsEnabled={paymentsEnabled}
                    paymentsBlockedReason={paymentsBlockedReason}
                    paymentsBlockedMessage={paymentsBlockedMessage}
                  />
                ) : (
                  <BookingCalendar
                    tutor={tutor}
                    slots={slots.filter((s) => s.available)}
                    paymentsEnabled={false}
                    paymentsBlockedReason="demo"
                    paymentsBlockedMessage="This is a sample portal. Create your own account to accept real bookings."
                    isDemo={true}
                  />
                )}
              </TabsContent>
              <TabsContent value="packages" className="mt-6">
                <LessonPackagesTab
                  tutor={tutor}
                  packages={packages}
                  paymentsEnabled={paymentsEnabled}
                  paymentsBlockedMessage={paymentsBlockedMessage}
                  isDemo={isSamplePortal}
                />
              </TabsContent>
              <TabsContent value="shelf" className="mt-6">
                <ResourceShelf
                  resources={resources}
                  tutorUsername={username}
                  paymentsEnabled={paymentsEnabled}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Desktop Placement: Join Group / Portal Signup (Hidden on mobile/tablet) */}
            {liveTutor && tutor.allowPublicJoining !== false ? (
              <div className="hidden lg:block">
                <JoinTutorFamily
                  tutor={tutor}
                  tutorUsername={username}
                  currentUserEmail={user?.email}
                  connectedStudents={connectedStudents}
                />
              </div>
            ) : null}

            {/* Custom Side Banner (Image upload with click link) */}
            {tutor.portalSideBannerUrl && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:scale-[1.01] transition-transform duration-200">
                {tutor.portalSideBannerLink ? (
                  <a href={tutor.portalSideBannerLink} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={tutor.portalSideBannerUrl} alt="Side Banner" className="w-full h-auto object-cover" />
                  </a>
                ) : (
                  <img src={tutor.coverUrl || tutor.portalSideBannerUrl} alt="Side Banner" className="w-full h-auto object-cover" />
                )}
              </div>
            )}

            {/* Custom Side Text Widget (Credentials / Testimonials) */}
            {tutor.portalSideWidgetTitle && tutor.portalSideWidgetContent && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
                <h4 className="font-heading text-sm font-bold text-foreground">
                  {tutor.portalSideWidgetTitle}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {tutor.portalSideWidgetContent}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </PortalThemeWrapper>
  );
}
