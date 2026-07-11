import { RateCalculatorClient } from "@/app/tools/rate-calculator/rate-calculator-client";

export const metadata = {
  title: "Tutor Rate Calculator",
};

export default function DashboardRateCalculatorPage() {
  return (
    <div className="px-6 py-4">
      <RateCalculatorClient />
    </div>
  );
}
