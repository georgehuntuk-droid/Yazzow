import { InvoiceGeneratorClient } from "@/app/tools/invoice-generator/invoice-generator-client";

export const metadata = {
  title: "Tutor Invoice Maker",
};

export default function DashboardInvoiceGeneratorPage() {
  return (
    <div className="px-6 py-4">
      <InvoiceGeneratorClient />
    </div>
  );
}
