import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLATFORM_FEES } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import type { DigitalPackSale } from "@/lib/tutors/portal-data";

type DigitalSalesLedgerProps = {
  sales: DigitalPackSale[];
  currency: string;
};

export function DigitalSalesLedger({ sales, currency }: DigitalSalesLedgerProps) {
  const totals = sales.reduce(
    (acc, sale) => ({
      gross: acc.gross + sale.amountCents,
      fees: acc.fees + sale.platformFeeCents,
      net: acc.net + sale.tutorNetCents,
    }),
    { gross: 0, fees: 0, net: 0 },
  );

  return (
    <Card className="yazz-surface">
      <CardHeader>
        <CardTitle className="font-heading">Learning pack sales</CardTitle>
        <CardDescription>
          Each sale is tracked automatically. Yazzow keeps {PLATFORM_FEES.digitalGoodsPercent}%
          on packs only — not on lesson bookings. Your share is paid out via Stripe Connect.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {sales.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No pack sales yet. Upload a PDF or DOCX above — parents buy from The shelf on your
            portal.
          </p>
        ) : (
          <>
            <dl className="grid gap-4 border-b border-border/60 px-4 py-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Gross (recent)</dt>
                <dd className="text-lg font-semibold">{formatMoney(totals.gross, currency)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Yazzow fee</dt>
                <dd className="text-lg font-semibold text-muted-foreground">
                  −{formatMoney(totals.fees, currency)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Your share</dt>
                <dd className="text-lg font-semibold text-primary">
                  {formatMoney(totals.net, currency)}
                </dd>
              </div>
            </dl>
            <ul className="divide-y divide-border/60">
              {sales.map((sale) => (
                <li key={sale.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{sale.resourceTitle}</p>
                      <p className="text-muted-foreground">{sale.buyerEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">
                        {formatMoney(sale.tutorNetCents, currency)} to you
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(sale.amountCents, currency)} sale · −
                        {formatMoney(sale.platformFeeCents, currency)} fee
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
