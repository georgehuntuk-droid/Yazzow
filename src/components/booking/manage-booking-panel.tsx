"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [showStudentLateForm, setShowStudentLateForm] = useState(false);
  const [studentLateNote, setStudentLateNote] = useState("");
  const [sendingLate, setSendingLate] = useState(false);
  const [studentLateSent, setStudentLateSent] = useState(!!booking.studentRunningLateSentAt);
  const [studentLateNoteSaved, setStudentLateNoteSaved] = useState(booking.studentRunningLateNote ?? "");

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

  async function handleStudentRunningLate(e: React.FormEvent) {
    e.preventDefault();
    setSendingLate(true);
    setError(null);

    try {
      const response = await fetch("/api/booking/running-late", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: booking.token, note: studentLateNote }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send update.");
      }
      setStudentLateSent(true);
      setStudentLateNoteSaved(studentLateNote);
      setShowStudentLateForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Could not send notice.");
    } finally {
      setSendingLate(false);
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
        {booking.runningLateSentAt ? (
          <div className="rounded-xl border border-amber-200 bg-amber-500/10 dark:bg-amber-950/40 p-3.5 text-xs text-amber-800 dark:text-amber-300 leading-normal font-medium mb-3 flex items-start gap-2">
            <span>⏳</span>
            <div>
              <p className="font-bold">{booking.tutorDisplayName} is running late</p>
              {booking.runningLateNote ? (
                <p className="mt-1 italic opacity-95 font-medium">&ldquo;{booking.runningLateNote}&rdquo;</p>
              ) : (
                <p className="mt-0.5 text-muted-foreground">They notified they will be running a little late. The lesson is still on!</p>
              )}
            </div>
          </div>
        ) : null}

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">When</dt>
            <dd className="font-medium">{booking.slotLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Payment Status</dt>
            <dd className="font-medium">
              {booking.stripePaymentIntentId === "cash" ? (
                booking.isPaid ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Paid offline / cash ({booking.amountLabel})</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold animate-pulse">Unpaid / Owed ({booking.amountLabel})</span>
                )
              ) : (
                <span className="text-muted-foreground font-semibold">Paid via card ({booking.amountLabel})</span>
              )}
            </dd>
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

        {!booking.isPaid && booking.stripePaymentIntentId === "cash" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-950/40 dark:bg-amber-950/10 p-4 space-y-2 mt-2">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
              Offline Payment Instructions
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-wrap">
              {booking.tutorPaymentInstructions || "Please contact the tutor directly to arrange bank transfer or cash payment details."}
            </p>
          </div>
        )}

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

        {!cancelled && new Date(booking.slotEndsAt) > new Date() && (
          <div className="pt-2.5 border-t border-border/40 mt-4 space-y-3">
            {studentLateSent ? (
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-3.5 text-xs text-muted-foreground leading-normal">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  ✓ Running late notice sent to tutor
                </p>
                {studentLateNoteSaved && (
                  <p className="mt-1 italic">&ldquo;{studentLateNoteSaved}&rdquo;</p>
                )}
              </div>
            ) : showStudentLateForm ? (
              <form onSubmit={handleStudentRunningLate} className="space-y-2.5 rounded-xl border border-border bg-muted/20 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-xs font-bold text-foreground">Notify tutor you are running late</p>
                <div className="flex gap-2">
                  <Input
                    required
                    placeholder="Optional message, e.g. 'Stuck in traffic, 10m late'"
                    value={studentLateNote}
                    onChange={(e) => setStudentLateNote(e.target.value)}
                    className="h-9 text-xs bg-background flex-1"
                    disabled={sendingLate}
                  />
                  <Button type="submit" size="sm" disabled={sendingLate} className="h-9 shrink-0">
                    {sendingLate ? "Sending..." : "Send"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowStudentLateForm(false)} className="h-9 shrink-0 text-xs">
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs font-semibold h-9 rounded-xl border-border/80 hover:bg-muted/50 transition-colors"
                onClick={() => setShowStudentLateForm(true)}
              >
                ⏳ I&apos;m running late
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
