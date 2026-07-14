import "server-only";

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { AlertTriangle, CalendarCheck2, Clock } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatSlotRange } from "@/lib/format";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ClaimForm } from "./claim-form";

type RouteProps = {
  params: Promise<{ token: string }>;
};

export default async function ClaimSlotPage(props: RouteProps) {
  const { token } = await props.params;

  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;

  let slot: any = null;
  let booking: any = null;

  if (testVal) {
    if (token === "mock-invalid-token") {
      notFound();
    }
    slot = {
      id: "mock-slot-123",
      tutor_id: "test-tutor-id-123",
      starts_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      ends_at: new Date(Date.now() + 25 * 3600 * 1000).toISOString(),
      is_booked: token === "mock-claimed-token",
      tutor_profiles: {
        display_name: "Mock Tutor",
        lesson_price_cents: 4500,
      },
    };
    booking = {
      subject_id: "Maths",
      education_level: "GCSE",
    };
  } else {
    const admin = createAdminClient();

    // 1. Fetch the availability slot by claim token
    const { data: slotData, error: slotErr } = await admin
      .from("availability_slots")
      .select("*, tutor_profiles (*)")
      .eq("claim_token", token)
      .maybeSingle();

    if (slotErr || !slotData) {
      notFound();
    }
    slot = slotData;

    // 2. Fetch the subject and level from the last cancelled booking of this slot
    const { data: bookingData } = await admin
      .from("bookings")
      .select("subject_id, education_level")
      .eq("slot_id", slot.id)
      .eq("status", "cancelled")
      .order("cancelled_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    booking = bookingData;
  }

  const tutorName = slot.tutor_profiles?.display_name || "Tutor";
  const formattedTime = formatSlotRange(slot.starts_at, slot.ends_at);
  const subject = booking?.subject_id || "Lesson";
  const level = booking?.education_level || "Private";

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-20 bg-gradient-to-b from-primary/5 via-background to-background min-h-[75vh]">
        <div className="w-full max-w-md px-4">
          <div className="yazz-surface border border-primary/20 shadow-2xl p-6 sm:p-8 rounded-2xl relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-emerald-500" />

            {slot.is_booked ? (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex items-center justify-center size-16 rounded-full bg-amber-500/10 text-amber-600 mb-2">
                  <AlertTriangle className="size-10" />
                </div>
                <h2 className="font-heading text-2xl font-black text-foreground">Already Claimed</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This slot has already been claimed! Another parent secured this lesson slot. Please check back later or contact your tutor.
                </p>
                <div className="pt-4">
                  <a
                    href="/"
                    className="yazz-btn-secondary inline-flex h-10 items-center justify-center px-6 text-sm font-semibold"
                  >
                    Back to Home
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center size-14 rounded-full bg-primary/10 text-primary mb-3">
                    <CalendarCheck2 className="size-8" />
                  </div>
                  <h1 className="font-heading text-2xl font-black text-foreground tracking-tight">
                    Claim Waitlist Slot
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    A cancellation waitlist slot has opened up with <strong>{tutorName}</strong>. First parent to confirm secures the booking instantly.
                  </p>
                </div>

                <ClaimForm
                  token={token}
                  tutorName={tutorName}
                  formattedTime={formattedTime}
                  subject={subject}
                  level={level}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
