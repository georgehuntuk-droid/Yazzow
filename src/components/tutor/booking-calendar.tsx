"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronRight, CalendarDays, Grid3X3, Clock } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LessonCheckoutButton } from "@/components/tutor/lesson-checkout-button";
import { formatMoney, formatSlotRange } from "@/lib/format";
import type { OpenSlot, TutorProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

type BookingCalendarProps = {
  tutor: TutorProfile;
  slots: OpenSlot[];
  paymentsEnabled?: boolean;
  paymentsBlockedReason?: "stripe" | "subscription" | "demo";
  paymentsBlockedMessage?: string;
  isDemo?: boolean;
};

export function BookingCalendar({
  tutor,
  slots,
  paymentsEnabled = true,
  paymentsBlockedReason,
  paymentsBlockedMessage,
  isDemo = false,
}: BookingCalendarProps) {
  const openSlots = slots.filter((slot) => slot.available);
  
  // Group slots by their calendar date
  const groupedSlots = useMemo(() => {
    const groups: Record<string, OpenSlot[]> = {};
    openSlots.forEach((slot) => {
      const dateObj = new Date(slot.startsAt);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(slot);
    });
    return groups;
  }, [openSlots]);

  const dateKeys = Object.keys(groupedSlots);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    dateKeys[0] ?? null
  );

  const activeDateSlots = selectedDateKey ? groupedSlots[selectedDateKey] ?? [] : [];
  const [selectedId, setSelectedId] = useState<string | null>(
    activeDateSlots[0]?.id ?? null
  );

  // If date selection changes, default to its first slot
  useEffect(() => {
    if (selectedDateKey && groupedSlots[selectedDateKey]) {
      const firstSlot = groupedSlots[selectedDateKey][0];
      if (firstSlot && !groupedSlots[selectedDateKey].some(s => s.id === selectedId)) {
        setSelectedId(firstSlot.id);
      }
    }
  }, [selectedDateKey, groupedSlots]);

  const selected = openSlots.find((slot) => slot.id === selectedId);

  const formatTimeOnly = (startsAt: string, endsAt: string): string => {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  };

  return (
    <Card className="yazz-surface overflow-hidden border-border/70 p-0 sm:p-2">
      <CardHeader className="px-6 pt-6 pb-4 sm:pb-6">
        <CardTitle className="font-heading text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <CalendarDays className="size-5.5 text-primary animate-pulse" />
          Book Your Lesson
        </CardTitle>
        <CardDescription className="text-sm">
          Select a date on the calendar timeline, then choose your preferred hour slot to book.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-6 pb-6 space-y-6">
        {openSlots.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No open slots right now. Check back soon.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">
            {/* Left Panel: Calendar Date Timeline Selector */}
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-primary" />
                1. Select Date
              </span>
              <div className="flex flex-row overflow-x-auto gap-2 pb-2 md:flex-col md:overflow-visible md:pb-0 scrollbar-none">
                {dateKeys.map((dateKey) => {
                  const isDateSelected = selectedDateKey === dateKey;
                  const dateObj = new Date(dateKey + "T00:00:00");
                  const wday = dateObj.toLocaleDateString("en-GB", { weekday: "short" });
                  const day = dateObj.getDate().toString();
                  const mth = dateObj.toLocaleDateString("en-GB", { month: "short" });
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => {
                        setSelectedDateKey(dateKey);
                        const firstSlot = groupedSlots[dateKey]?.[0];
                        if (firstSlot) setSelectedId(firstSlot.id);
                      }}
                      className={cn(
                        "flex flex-col items-start gap-0.5 justify-center w-36 shrink-0 md:w-full p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer",
                        isDateSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-blue-500/15"
                          : "border-border bg-card hover:bg-muted/40 hover:border-primary/20 text-foreground"
                      )}
                    >
                      <span className={cn("text-[10px] font-black uppercase tracking-wider", isDateSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {wday}
                      </span>
                      <span className="text-base font-bold tracking-tight mt-0.5">
                        {day} {mth}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Time Slots & Checkout Panel */}
            <div className="space-y-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" />
                2. Pick Time
              </span>

              {/* Time slot grid view */}
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                {activeDateSlots.map((slot) => {
                  const isSlotSelected = selectedId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedId(slot.id)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer h-13",
                        isSlotSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:bg-muted/40 hover:border-primary/25 bg-card"
                      )}
                    >
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground">
                        <span className={cn("size-2 rounded-full", isSlotSelected ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                        {formatTimeOnly(slot.startsAt, slot.endsAt)}
                      </span>
                      <span className="text-xs font-black text-primary">
                        {formatMoney(tutor.lessonPriceCents, tutor.currency)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Booking Checkout form inside card */}
              {selected ? (
                <div className="mt-4 rounded-2xl border border-primary/10 bg-muted/10 p-5 shadow-sm shadow-blue-500/5 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1 mb-4">

                    <Grid3X3 className="size-3.5" />
                    3. Secure Booking Details
                  </span>
                  <LessonCheckoutButton
                    tutor={tutor}
                    slot={selected}
                    isDemo={isDemo}
                    paymentsEnabled={paymentsEnabled}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentsBlockedMessage({
  reason,
  message,
}: {
  reason?: "stripe" | "subscription" | "demo";
  message?: string;
}) {
  if (message) {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>{message}</p>
        {reason === "subscription" ? (
          <p className="text-xs">
            The tutor needs an active Yazzow subscription before parents can pay online.
          </p>
        ) : null}
        {reason === "stripe" ? (
          <p className="text-xs">
            The tutor still needs to finish card payout setup with Stripe.
          </p>
        ) : null}
      </div>
    );
  }

  if (reason === "demo") {
    return (
      <p className="text-sm text-muted-foreground">
        This is a sample portal for preview only. Bookings open once a tutor shares their
        live link with Stripe connected.
      </p>
    );
  }

  if (reason === "subscription") {
    return (
      <p className="text-sm text-muted-foreground">
        Paid online booking is paused — this tutor&apos;s Yazzow subscription is not active.
        Please contact them directly or check back later.
      </p>
    );
  }

  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <p>
        This tutor is still finishing Stripe payout setup, so paid booking is not available
        yet.
      </p>
      <p>
        If you are the tutor, complete setup under{" "}
        <Link href="/dashboard/payments" className="font-medium text-primary underline">
          Dashboard → Payments
        </Link>
        .
      </p>
    </div>
  );
}
