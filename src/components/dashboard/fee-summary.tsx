import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { PLATFORM_FEES } from "@/lib/constants";
import { tutorPayoutCents } from "@/lib/stripe/fees";

type FeeSummaryProps = {
  tutorId: string;
};

export async function FeeSummary({ tutorId }: FeeSummaryProps) {
  const supabase = await createClient();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const since = weekAgo.toISOString();

  const [{ data: bookings }, { data: purchases }] = await Promise.all([
    supabase
      .from("bookings")
      .select("amount_cents, platform_fee_cents")
      .eq("tutor_id", tutorId)
      .gte("created_at", since),
    supabase
      .from("resource_purchases")
      .select("amount_cents, platform_fee_cents")
      .eq("tutor_id", tutorId)
      .gte("created_at", since),
  ]);

  const lessonRows = bookings ?? [];
  const digitalRows = purchases ?? [];

  const lessonGross = lessonRows.reduce((sum, row) => sum + row.amount_cents, 0);
  const lessonFees = lessonRows.reduce((sum, row) => sum + row.platform_fee_cents, 0);
  const digitalGross = digitalRows.reduce((sum, row) => sum + row.amount_cents, 0);
  const digitalFees = digitalRows.reduce((sum, row) => sum + row.platform_fee_cents, 0);

  const totalGross = lessonGross + digitalGross;
  const totalFees = lessonFees + digitalFees;
  const totalNet = totalGross - totalFees;
  const transactionCount = lessonRows.length + digitalRows.length;

  return (
    <Card className="yazz-surface">
      <CardHeader>
        <CardTitle className="font-heading">This week&apos;s activity</CardTitle>
        <CardDescription>
          Fees are taken per payment ({PLATFORM_FEES.lessonBookingPercent}% lessons,{" "}
          {PLATFORM_FEES.digitalGoodsPercent}% digital) — not invoiced weekly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactionCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            No paid bookings or sales in the last 7 days yet.
          </p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Gross volume</dt>
              <dd className="text-xl font-semibold">{formatMoney(totalGross)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Platform fees (Yazzow)</dt>
              <dd className="text-xl font-semibold text-muted-foreground">
                −{formatMoney(totalFees)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Your share (before Stripe payout)</dt>
              <dd className="text-xl font-semibold text-primary">{formatMoney(totalNet)}</dd>
            </div>
          </dl>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Example: a {formatMoney(4500)} lesson → you receive about{" "}
          {formatMoney(tutorPayoutCents(4500, "lesson"))} after the{" "}
          {PLATFORM_FEES.lessonBookingPercent}% fee.
        </p>
      </CardContent>
    </Card>
  );
}
