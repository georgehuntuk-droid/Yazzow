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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BRAND_NAME } from "@/lib/constants";
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
  searchParams: Promise<{ booked?: string; cancelled?: string; session_id?: string }>;
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

  if (!tutor) {
    notFound();
  }

  let bookingManageUrl: string | null = null;

  if (
    liveTutor &&
    query.booked === "1" &&
    query.session_id &&
    isStripeConfigured()
  ) {
    const admin = createAdminClient();
    const { data: tutorRow } = await admin
      .from("tutor_profiles")
      .select("stripe_account_id")
      .eq("id", liveTutor.id)
      .maybeSingle();

    const stripeAccountId = (tutorRow as Pick<TutorProfileRow, "stripe_account_id"> | null)
      ?.stripe_account_id;

    if (stripeAccountId) {
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
      {tutor.portalAnnouncementActive && tutor.portalAnnouncement ? (
        <div className="bg-primary px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-primary-foreground select-none relative animate-in slide-in-from-top-full duration-300">
          <span className="inline-flex items-center gap-1.5">
            📢 {tutor.portalAnnouncement}
          </span>
        </div>
      ) : null}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="yazz-container flex h-16 max-w-5xl items-center justify-between gap-4">
          <Logo size="header" href="/" />
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
          ) : null}
        </div>
      </header>

      <main className="yazz-container max-w-5xl space-y-8 py-8 sm:space-y-10 sm:py-10">
        <PublicProfile tutor={tutor} />

        <Suspense fallback={null}>
          <BookingStatusBanner manageUrl={bookingManageUrl} />
        </Suspense>

        {liveTutor && tutor.allowPublicJoining !== false ? (
          <JoinTutorFamily
            tutor={tutor}
            tutorUsername={username}
            currentUserEmail={user?.email}
            connectedStudents={connectedStudents}
          />
        ) : null}

        <Tabs defaultValue="book">
          <TabsList className="h-11 w-full justify-start rounded-xl bg-muted/60 p-1 sm:w-auto">
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
            <ResourceShelf resources={resources} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </PortalThemeWrapper>
  );
}
