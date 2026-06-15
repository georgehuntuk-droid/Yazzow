import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PortalBookingStatus } from "@/lib/tutors/portal-booking-status";

type PortalBookingStatusCardProps = {
  status: PortalBookingStatus;
};

export function PortalBookingStatusCard({ status }: PortalBookingStatusCardProps) {
  return (
    <Card
      className={
        status.canAcceptBookings
          ? "yazz-surface border-primary/25"
          : "yazz-surface border-amber-200/70 bg-amber-50/40 dark:bg-amber-950/20"
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-heading">Online booking status</CardTitle>
            <CardDescription className="mt-1">
              Parents see this on your portal when they try to pay for a slot.
            </CardDescription>
          </div>
          <Badge variant={status.canAcceptBookings ? "default" : "secondary"}>
            {status.canAcceptBookings ? "Live" : "Paused"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          <StatusRow
            ok={status.subscriptionActive}
            label="Yazzow subscription"
            detail={
              status.subscriptionActive
                ? (status.subscriptionStatus ?? "active")
                : status.subscriptionStatus === "setup required"
                  ? "database setup needed"
                  : "not subscribed"
            }
          />
          <StatusRow
            ok={status.stripeConnectReady}
            label="Stripe payouts (lessons)"
            detail={status.stripeConnectReady ? "connected" : "setup needed"}
          />
        </ul>

        {!status.canAcceptBookings && status.tutorFixSteps.length > 0 ? (
          <div className="rounded-xl border border-amber-200/60 bg-background/80 px-4 py-3 text-sm">
            <p className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <AlertCircle className="size-4 text-amber-600" />
              Why parents see &quot;booking temporarily unavailable&quot;
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              {status.tutorFixSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <Button size="sm" className="mt-3" render={<Link href="/dashboard/payments" />}>
              Fix in Payments
            </Button>
          </div>
        ) : null}

        {status.canAcceptBookings ? (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              {status.stripeConnectReady
                ? "Parents can book and pay on your portal link."
                : "Parents can book lessons on your portal using direct/cash payments."}
            </p>
            {!status.stripeConnectReady && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-3.5 text-xs text-foreground font-medium space-y-1.5 mt-2">
                <p className="font-bold text-primary flex items-center gap-1">
                  💵 Direct/Cash Bookings Active
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Your bookings are Live via direct/cash payments. Complete your Stripe setup to enable online card checkout.
                </p>
                <Button size="sm" className="mt-1" render={<Link href="/dashboard/payments" />}>
                  Connect Stripe payouts
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatusRow({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={ok ? "font-medium text-primary" : "font-medium text-amber-700 dark:text-amber-400"}>
        {ok ? "✓" : "✗"} {detail}
      </span>
    </li>
  );
}
