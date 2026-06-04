import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TUTOR_SUBSCRIPTION } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import type { PlatformRevenueStats } from "@/lib/platform/revenue";

type PlatformRevenuePanelProps = {
  stats: PlatformRevenueStats;
};

export function PlatformRevenuePanel({ stats }: PlatformRevenuePanelProps) {
  return (
    <Card className="yazz-surface border-amber-200/60 bg-amber-50/30 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="font-heading">Platform overview (admin)</CardTitle>
        <CardDescription>
          Revenue is tutor subscriptions ({TUTOR_SUBSCRIPTION.label}). No per-sale commission on
          lessons or packs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Active tutor subscriptions</dt>
            <dd className="text-2xl font-semibold">{stats.activeSubscriptions}</dd>
            <dd className="text-sm text-primary">
              ≈ {formatMoney(stats.estimatedSubscriptionMrrCents)}/month MRR
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Pack sales (30 days)</dt>
            <dd className="text-2xl font-semibold">
              {formatMoney(stats.digitalSales30dGrossCents)}
            </dd>
            <dd className="text-sm text-muted-foreground">
              {stats.digitalSales30d} sale{stats.digitalSales30d === 1 ? "" : "s"} · tutor volume
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Lesson volume (30 days)</dt>
            <dd className="text-2xl font-semibold">
              {formatMoney(stats.lessonVolume30dCents)}
            </dd>
            <dd className="text-sm text-muted-foreground">
              {stats.lessonBookings30d} booking
              {stats.lessonBookings30d === 1 ? "" : "s"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
