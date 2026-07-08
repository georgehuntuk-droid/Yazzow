import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

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
      .select("amount_cents")
      .eq("tutor_id", tutorId)
      .gte("created_at", since),
    supabase
      .from("resource_purchases")
      .select("amount_cents")
      .eq("tutor_id", tutorId)
      .gte("created_at", since),
  ]);

  const lessonRows = bookings ?? [];
  const digitalRows = purchases ?? [];

  const lessonGross = lessonRows.reduce((sum, row) => sum + row.amount_cents, 0);
  const digitalGross = digitalRows.reduce((sum, row) => sum + row.amount_cents, 0);
  const totalGross = lessonGross + digitalGross;
  const transactionCount = lessonRows.length + digitalRows.length;

  return (
    <Card className="yazz-surface">
      <CardHeader>
        <CardTitle className="font-heading">This week&apos;s activity</CardTitle>
        <CardDescription>
          Paid lesson bookings on your portal (Stripe processing applies). Your tutor
          subscription is billed separately. Pack sales are handled
          outside Yazzow.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactionCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            No paid bookings or sales in the last 7 days yet.
          </p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Gross volume</dt>
              <dd className="text-xl font-semibold">{formatMoney(totalGross)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Paid transactions</dt>
              <dd className="text-xl font-semibold">{transactionCount}</dd>
            </div>
          </dl>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Payout timing follows your connected Stripe account schedule.
        </p>
      </CardContent>
    </Card>
  );
}
