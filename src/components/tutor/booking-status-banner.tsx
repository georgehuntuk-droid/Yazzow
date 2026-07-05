"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type BookingStatusBannerProps = {
  manageUrl?: string | null;
};

export function BookingStatusBanner({ manageUrl }: BookingStatusBannerProps) {
  const searchParams = useSearchParams();
  const booked = searchParams.get("booked") === "1";
  const cancelled = searchParams.get("cancelled") === "1";
  const packageBooked = searchParams.get("package_booked") === "1";

  if (!booked && !cancelled && !packageBooked) return null;

  if (packageBooked) {
    return (
      <div
        role="status"
        className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3.5 text-sm text-foreground"
      >
        <p className="font-bold text-emerald-800">Lesson Bundle purchased successfully!</p>
        <p className="mt-1 text-muted-foreground leading-relaxed">
          Your credits have been added straight to your student account. You can log in using your email to book lessons without checking out each time.
        </p>
      </div>
    );
  }

  if (booked) {
    return (
      <div
        role="status"
        className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
      >
        <p className="font-medium">Lesson booked and paid</p>
        <p className="mt-1 text-muted-foreground">
          Your tutor has been notified. That time slot is no longer available to book.
          {manageUrl ? (
            <>
              {" "}
              <Link href={manageUrl} className="font-medium text-primary hover:underline">
                Manage or cancel this lesson
              </Link>
              — we also emailed you a link.
            </>
          ) : (
            " Check your inbox for a confirmation email with a link to manage or cancel."
          )}
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
