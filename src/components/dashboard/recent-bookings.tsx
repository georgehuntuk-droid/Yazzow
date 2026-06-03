"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cancelBooking, notifyRunningLate } from "@/lib/dashboard/actions";
import { formatMoney, formatSlotRange } from "@/lib/format";
import type { RecentBooking } from "@/lib/types";

type RecentBookingsProps = {
  bookings: RecentBooking[];
  currency: string;
};

export function RecentBookings({ bookings, currency }: RecentBookingsProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lateNote, setLateNote] = useState<Record<string, string>>({});
  const [showLateForm, setShowLateForm] = useState<string | null>(null);

  async function handleCancel(booking: RecentBooking) {
    if (new Date(booking.startsAt) <= new Date()) {
      setError("Only future lessons can be cancelled.");
      return;
    }

    if (
      !confirm(
        `Cancel this lesson with ${booking.studentName ?? booking.parentEmail}? The hour will reopen and other families will be notified.`,
      )
    ) {
      return;
    }

    setLoadingAction(`cancel-${booking.id}`);
    setError(null);

    const result = await cancelBooking(booking.id);
    if (!result.ok) {
      setError(result.error);
      setLoadingAction(null);
      return;
    }

    router.refresh();
    setLoadingAction(null);
  }

  async function handleRunningLate(booking: RecentBooking) {
    setLoadingAction(`late-${booking.id}`);
    setError(null);

    const result = await notifyRunningLate(booking.id, lateNote[booking.id]);
    if (!result.ok) {
      setError(result.error);
      setLoadingAction(null);
      return;
    }

    setError(null);
    setSuccess(result.message ?? "Update sent.");
    setShowLateForm(null);
    router.refresh();
    setLoadingAction(null);
  }

  const upcoming = bookings.filter((b) => new Date(b.endsAt) > new Date());

  return (
    <Card className="yazz-surface">
      <CardHeader>
        <CardTitle>Upcoming bookings</CardTitle>
        <CardDescription>
          Cancel to reopen the hour for other families. Use running late to email the parent
          without cancelling (lesson stays booked).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <p className="px-4 pt-4 text-sm text-destructive">{error}</p>
        ) : null}
        {success ? (
          <p className="px-4 pt-4 text-sm text-primary" role="status">
            {success}
          </p>
        ) : null}
        {upcoming.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No upcoming paid bookings.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {upcoming.map((booking) => {
              const lateOpen = showLateForm === booking.id;
              const isLateLoading = loadingAction === `late-${booking.id}`;
              const isCancelLoading = loadingAction === `cancel-${booking.id}`;

              return (
                <li key={booking.id} className="px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {formatSlotRange(booking.startsAt, booking.endsAt)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {booking.studentName
                          ? `${booking.studentName} · ${booking.parentEmail}`
                          : booking.parentEmail}
                      </p>
                      <p className="mt-1 text-sm font-medium text-primary">
                        {formatMoney(booking.amountCents, currency)} · paid
                      </p>
                      {booking.runningLateSentAt ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Running late notice sent
                          {booking.runningLateNote
                            ? `: “${booking.runningLateNote}”`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLateLoading || isCancelLoading}
                        onClick={() =>
                          setShowLateForm(lateOpen ? null : booking.id)
                        }
                      >
                        <Clock className="size-3.5" data-icon="inline-start" />
                        Running late
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isCancelLoading || isLateLoading}
                        onClick={() => handleCancel(booking)}
                      >
                        {isCancelLoading ? "Cancelling…" : "Cancel & reopen"}
                      </Button>
                    </div>
                  </div>
                  {lateOpen ? (
                    <div className="mt-3 space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                      <Input
                        placeholder='Optional note, e.g. "Running 10 minutes late"'
                        value={lateNote[booking.id] ?? ""}
                        onChange={(e) =>
                          setLateNote((prev) => ({
                            ...prev,
                            [booking.id]: e.target.value,
                          }))
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isLateLoading}
                          onClick={() => handleRunningLate(booking)}
                        >
                          {isLateLoading ? "Sending…" : "Email parent"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowLateForm(null)}
                        >
                          Close
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Emails the parent on this booking. Requires RESEND_API_KEY on the server.
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
