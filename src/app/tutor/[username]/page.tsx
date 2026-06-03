import { notFound } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { BookingCalendar } from "@/components/tutor/booking-calendar";
import { PublicProfile } from "@/components/tutor/public-profile";
import { ResourceShelf } from "@/components/tutor/resource-shelf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BRAND_NAME } from "@/lib/constants";
import {
  DEMO_OPEN_SLOTS,
  DEMO_RESOURCES,
  getDemoTutorByUsername,
} from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/stripe/server";
import { getTutorByUsername } from "@/lib/tutors/queries";
import {
  getOpenSlotsForTutor,
  getPublishedResourcesForTutor,
} from "@/lib/tutors/portal-data";

type TutorPortalPageProps = {
  params: Promise<{ username: string }>;
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

export default async function TutorPortalPage({ params }: TutorPortalPageProps) {
  const { username } = await params;

  const liveTutor = await getTutorByUsername(username);
  const demoTutor = !liveTutor ? getDemoTutorByUsername(username) : null;
  const tutor = liveTutor ?? demoTutor;

  if (!tutor) {
    notFound();
  }

  const slots = liveTutor
    ? await getOpenSlotsForTutor(liveTutor.id)
    : DEMO_OPEN_SLOTS;
  const resources = liveTutor
    ? await getPublishedResourcesForTutor(liveTutor.id)
    : DEMO_RESOURCES;

  let paymentsEnabled = false;
  if (liveTutor && isStripeConfigured()) {
    const supabase = await createClient();
    const { data: paymentRow } = await supabase
      .from("tutor_profiles")
      .select("stripe_account_id")
      .eq("id", liveTutor.id)
      .maybeSingle();
    paymentsEnabled = Boolean(paymentRow?.stripe_account_id);
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="yazz-container flex h-16 max-w-5xl items-center justify-between">
          <Logo size="header" />
          <p className="hidden rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs text-muted-foreground sm:block">
            Private portal · not in any directory
          </p>
        </div>
      </header>

      <main className="yazz-container max-w-5xl space-y-8 py-8 sm:space-y-10 sm:py-10">
        <PublicProfile tutor={tutor} />

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
            {slots.length === 0 ? (
              <div className="yazz-panel px-6 py-14 text-center text-muted-foreground">
                No open slots right now. Check back soon or message your tutor directly.
              </div>
            ) : (
              <BookingCalendar
                tutor={tutor}
                slots={slots}
                paymentsEnabled={paymentsEnabled}
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
  );
}
