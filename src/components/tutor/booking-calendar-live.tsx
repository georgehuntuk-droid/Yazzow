"use client";

import { useCallback, useEffect, useState } from "react";

import { BookingCalendar } from "@/components/tutor/booking-calendar";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { OpenSlot, TutorProfile } from "@/lib/types";

type BookingCalendarLiveProps = {
  tutor: TutorProfile;
  tutorUsername: string;
  initialSlots: OpenSlot[];
  paymentsEnabled?: boolean;
  paymentsBlockedReason?: "stripe" | "subscription" | "demo";
  paymentsBlockedMessage?: string;
};

export function BookingCalendarLive({
  tutor,
  tutorUsername,
  initialSlots,
  paymentsEnabled,
  paymentsBlockedReason,
  paymentsBlockedMessage,
}: BookingCalendarLiveProps) {
  const [slots, setSlots] = useState(initialSlots);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);

  const refreshSlots = useCallback(async () => {
    try {
      const response = await fetch(`/api/tutor/${tutorUsername}/open-slots`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as { slots: OpenSlot[] };
      setSlots(data.slots);
    } catch {
      // ignore polling errors
    }
  }, [tutorUsername]);

  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`availability:${tutor.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "availability_slots",
          filter: `tutor_id=eq.${tutor.id}`,
        },
        () => {
          void refreshSlots().then(() => {
            setLiveMessage("Calendar updated — a slot may have just opened.");
            window.setTimeout(() => setLiveMessage(null), 8000);
          });
        },
      )
      .subscribe();

    const poll = window.setInterval(() => {
      void refreshSlots();
    }, 60_000);

    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [tutor.id, refreshSlots]);

  return (
    <div className="space-y-4">
      {liveMessage ? (
        <p
          role="status"
          className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-2 text-sm text-foreground"
        >
          {liveMessage}
        </p>
      ) : null}
      <BookingCalendar
        tutor={tutor}
        slots={slots}
        paymentsEnabled={paymentsEnabled}
        paymentsBlockedReason={paymentsBlockedReason}
        paymentsBlockedMessage={paymentsBlockedMessage}
        isDemo={false}
      />
    </div>
  );
}
