"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TUTOR_PUBLIC_PATH } from "@/lib/constants";
import type { BookingManageView } from "@/lib/bookings/booking-manage";

type ManageBookingPanelProps = {
  booking: BookingManageView;
};

export function ManageBookingPanel({ booking }: ManageBookingPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(booking.status === "cancelled");

  async function handleCancel() {
    if (
      !confirm(
        `Cancel this lesson on ${booking.slotLabel}? The hour will reopen for other families to book. Refunds are handled directly with ${booking.tutorDisplayName} if needed.`,
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: booking.token }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not cancel this booking.");
        setLoading(false);
        return;
      }

      setCancelled(true);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const portalHref = `${TUTOR_PUBLIC_PATH}/${booking.tutorUsername}`;

  return (
    <Card className="yazz-surface w-full border-primary/10">
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-bold">
          {cancelled ? "Lesson cancelled" : "Your lesson"}
        </CardTitle>
        <CardDescription>
          {cancelled
            ? "This hour is open again on the tutor portal. Other families may have been notified."
            : `Booked with ${booking.tutorDisplayName}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">When</dt>
            <dd className="font-medium">{booking.slotLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Paid</dt>
            <dd className="font-medium">{booking.amountLabel}</dd>
          </div>
          {booking.studentName ? (
            <div>
              <dt className="text-muted-foreground">Student</dt>
              <dd className="font-medium">{booking.studentName}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground">Parent email</dt>
            <dd className="font-medium">{booking.parentEmail}</dd>
          </div>
        </dl>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {cancelled ? (
          <Link href={portalHref} className={buttonVariants({ className: "w-full" })}>
            Back to {booking.tutorDisplayName}&apos;s portal
          </Link>
        ) : booking.canCancel ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              disabled={loading}
              onClick={handleCancel}
            >
              {loading ? "Cancelling…" : "Cancel this lesson"}
            </Button>
            <Link
              href={portalHref}
              className={buttonVariants({ variant: "outline", className: "flex-1" })}
            >
              View portal
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This lesson can no longer be cancelled online. Contact {booking.tutorDisplayName}{" "}
            directly if you need help.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
