import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { PLATFORM_FEES, TUTOR_SUBSCRIPTION } from "@/lib/constants";
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
  const digitalGross = digitalRows.reduce((sum, row) => sum + row.amount_cents, 0);
  const digitalFees = digitalRows.reduce((sum, row) => sum + row.platform_fee_cents, 0);

  const totalGross = lessonGross + digitalGross;
  const totalNet = lessonGross + (digitalGross - digitalFees);
  const transactionCount = lessonRows.length + digitalRows.length;

  return (
    <Card className="yazz-surface">
      <CardHeader>
        <CardTitle className="font-heading">This week&apos;s activity</CardTitle>
        <CardDescription>
          Lessons: no per-booking fee (you keep the lesson price). Digital packs:{" "}
          {PLATFORM_FEES.digitalGoodsPercent}% platform fee. Your {TUTOR_SUBSCRIPTION.label}{" "}
          subscription is billed separately.
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
              <dt className="text-xs text-muted-foreground">Digital platform fees</dt>
              <dd className="text-xl font-semibold text-muted-foreground">
                −{formatMoney(digitalFees)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Your share (before Stripe payout)</dt>
              <dd className="text-xl font-semibold text-primary">{formatMoney(totalNet)}</dd>
            </div>
          </dl>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Example: a {formatMoney(1200)} worksheet pack → you receive about{" "}
          {formatMoney(tutorPayoutCents(1200))} after the{" "}
          {PLATFORM_FEES.digitalGoodsPercent}% fee.
        </p>
      </CardContent>
    </Card>
  );
}
