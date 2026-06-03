"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
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
};

export function BookingCalendar({
  tutor,
  slots,
  paymentsEnabled = true,
  paymentsBlockedReason,
  paymentsBlockedMessage,
}: BookingCalendarProps) {
  const openSlots = slots.filter((slot) => slot.available);
  const [selectedId, setSelectedId] = useState<string | null>(
    openSlots[0]?.id ?? null,
  );
  const selected = openSlots.find((slot) => slot.id === selectedId);

  return (
    <Card className="yazz-surface border-border/70">
      <CardHeader>
        <CardTitle className="font-heading">Open slots</CardTitle>
        <CardDescription>
          Tap a time to open checkout, enter your email, and pay securely with Stripe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {openSlots.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No open slots right now.
          </p>
        ) : (
          openSlots.map((slot) => {
            const isSelected = selectedId === slot.id;

            return (
              <div
                key={slot.id}
                className={cn(
                  "overflow-hidden rounded-xl border transition-colors",
                  isSelected
                    ? "border-primary shadow-sm ring-1 ring-primary/20"
                    : "border-border",
                )}
              >
                <button
                  type="button"
                  aria-expanded={isSelected}
                  onClick={() => setSelectedId(isSelected ? null : slot.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/50",
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <ChevronRight
                      className={cn(
                        "size-4 shrink-0 text-primary transition-transform",
                        isSelected && "rotate-90",
                      )}
                    />
                    <span className="font-medium">
                      {formatSlotRange(slot.startsAt, slot.endsAt)}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium text-primary">
                    {formatMoney(tutor.lessonPriceCents, tutor.currency)}
                  </span>
                </button>

                {isSelected ? (
                  <div className="border-t border-border/80 bg-card/50 px-4 py-4">
                    {!paymentsEnabled ? (
                      <PaymentsBlockedMessage
                        reason={paymentsBlockedReason}
                        message={paymentsBlockedMessage}
                      />
                    ) : (
                      <LessonCheckoutButton tutor={tutor} slot={slot} />
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}

        {openSlots.length > 0 && !selected ? (
          <p className="pt-2 text-center text-sm text-muted-foreground">
            Select a time above to book and pay.
          </p>
        ) : null}
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
