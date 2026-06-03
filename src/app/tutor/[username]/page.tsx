import { Suspense } from "react";
import { notFound } from "next/navigation";

import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { BookingCalendar } from "@/components/tutor/booking-calendar";
import { BookingCalendarLive } from "@/components/tutor/booking-calendar-live";
import { BookingStatusBanner } from "@/components/tutor/booking-status-banner";
import { JoinTutorFamily } from "@/components/tutor/join-tutor-family";
import { PortalThemeWrapper } from "@/components/tutor/portal-theme-wrapper";
import { PublicProfile } from "@/components/tutor/public-profile";
import { ResourceShelf } from "@/components/tutor/resource-shelf";
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
import { getTutorByUsername } from "@/lib/tutors/queries";
import {
  getOpenSlotsForTutor,
  getPublishedResourcesForTutor,
} from "@/lib/tutors/portal-data";

export const dynamic = "force-dynamic";

type TutorPortalPageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ booked?: string; cancelled?: string; session_id?: string }>;
};

export async function generateMetadata({ params }: TutorPortalPageProps) {
  const { username } = await params;
  const tutor = (await getTutorByUsername(username)) ?? getDemoTutorByUsername(username);
  if (!tutor) return { title: `Tutor not found · ${BRAND_NAME}` };
  return {
    title: `${tutor.displayName} · ${BRAND_NAME}`,
    description: tutor.headline,
  };
}

const DEMO_USERNAMES = new Set(["demo", "maya-chen"]);

export default async function TutorPortalPage({ params, searchParams }: TutorPortalPageProps) {
  const { username } = await params;
  const query = await searchParams;

  const isSamplePortal = DEMO_USERNAMES.has(username);
  const liveTutor = isSamplePortal ? null : await getTutorByUsername(username);
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

  const slots = liveTutor
    ? await getOpenSlotsForTutor(liveTutor.id)
    : DEMO_OPEN_SLOTS;
  const resources = liveTutor
    ? await getPublishedResourcesForTutor(liveTutor.id)
    : DEMO_RESOURCES;

  const portalBooking = liveTutor
    ? await getPortalBookingStatus(liveTutor.id)
    : await getPortalBookingStatus("", { isDemo: true });

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
          ) : (
            <p className="hidden rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs text-muted-foreground sm:block">
              Private portal · not in any directory
            </p>
          )}
        </div>
      </header>

      <main className="yazz-container max-w-5xl space-y-8 py-8 sm:space-y-10 sm:py-10">
        <PublicProfile tutor={tutor} />

        <Suspense fallback={null}>
          <BookingStatusBanner manageUrl={bookingManageUrl} />
        </Suspense>

        {liveTutor ? <JoinTutorFamily tutor={tutor} tutorUsername={username} /> : null}

        <Tabs defaultValue="book">
          <TabsList className="h-11 w-full justify-start rounded-xl bg-muted/60 p-1 sm:w-auto">
            <TabsTrigger value="book" className="rounded-lg px-4">
              Book a lesson
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
              />
            )}
          </TabsContent>
          <TabsContent value="shelf" className="mt-6">
            <ResourceShelf
              resources={resources}
              tutorUsername={username}
              paymentsEnabled={paymentsEnabled}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </PortalThemeWrapper>
  );
}
