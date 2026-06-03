"use client";

import { useSearchParams } from "next/navigation";

export function BookingStatusBanner() {
  const searchParams = useSearchParams();
  const booked = searchParams.get("booked") === "1";
  const cancelled = searchParams.get("cancelled") === "1";

  if (!booked && !cancelled) return null;

  if (booked) {
    return (
      <div
        role="status"
        className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
      >
        <p className="font-medium">Lesson booked and paid</p>
        <p className="mt-1 text-muted-foreground">
          Your tutor has been notified. That time slot is no longer available to book.
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
    >
      Checkout was cancelled. Pick another open slot when you are ready.
    </div>
  );
}
