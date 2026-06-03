"use client";

import { useState } from "react";

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
};

export function BookingCalendar({ tutor, slots, paymentsEnabled = true }: BookingCalendarProps) {
  const [selectedId, setSelectedId] = useState<string | null>(slots[0]?.id ?? null);
  const selected = slots.find((slot) => slot.id === selectedId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="yazz-surface border-border/70">
        <CardHeader>
          <CardTitle className="font-heading">Open slots</CardTitle>
          <CardDescription>
            Select a time, enter your email, and pay securely via Stripe Checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {slots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              disabled={!slot.available}
              onClick={() => setSelectedId(slot.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                selectedId === slot.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <span>{formatSlotRange(slot.startsAt, slot.endsAt)}</span>
              <span className="font-medium text-primary">
                {formatMoney(tutor.lessonPriceCents, tutor.currency)}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="yazz-surface border-primary/20 shadow-md">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Book this lesson</CardTitle>
          <CardDescription>
            {selected
              ? formatSlotRange(selected.startsAt, selected.endsAt)
              : "Choose a slot"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!paymentsEnabled ? (
            <p className="text-sm text-muted-foreground">
              This tutor is still connecting Stripe payouts. Check back soon.
            </p>
          ) : selected ? (
            <LessonCheckoutButton tutor={tutor} slot={selected} />
          ) : (
            <p className="text-sm text-muted-foreground">Select an open slot to continue.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
