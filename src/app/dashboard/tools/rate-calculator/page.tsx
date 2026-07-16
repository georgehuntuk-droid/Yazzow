import { RateCalculatorClient } from "@/app/tools/rate-calculator/rate-calculator-client";
import { requireTutorProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Tutor Rate Calculator",
};

export default async function DashboardRateCalculatorPage() {
  const { profile } = await requireTutorProfile();
  return (
    <div className="px-6 py-4">
      <RateCalculatorClient defaultCurrency={profile.currency} isDashboard={true} />
    </div>
  );
}
