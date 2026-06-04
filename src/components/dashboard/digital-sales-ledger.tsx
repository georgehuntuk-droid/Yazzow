import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { DigitalPackSale } from "@/lib/tutors/portal-data";

type DigitalSalesLedgerProps = {
  sales: DigitalPackSale[];
  currency: string;
};

export function DigitalSalesLedger({ sales, currency }: DigitalSalesLedgerProps) {
  const gross = sales.reduce((sum, sale) => sum + sale.amountCents, 0);

  return (
    <Card className="yazz-surface">
      <CardHeader>
        <CardTitle className="font-heading">Learning pack sales</CardTitle>
        <CardDescription>
          Earlier pack sales processed through Yazzow (if any). New packs are sold directly by you.
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
            <dl className="border-b border-border/60 px-4 py-4">
              <div>
                <dt className="text-xs text-muted-foreground">Gross (recent)</dt>
                <dd className="text-lg font-semibold">{formatMoney(gross, currency)}</dd>
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
                    <p className="font-medium text-primary">
                      {formatMoney(sale.amountCents, currency)}
                    </p>
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
