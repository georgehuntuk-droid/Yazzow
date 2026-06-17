import { MarketingShell } from "@/components/layout/marketing-shell";
import { SupportContainer } from "@/components/support/support-container";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Support · ${BRAND_NAME}`,
  description: `Get in touch with the ${BRAND_NAME} support team. Submit a support ticket for billing, account setup, or general assistance.`,
};

export default function SupportPage() {
  return (
    <MarketingShell>
      <div className="yazz-container flex-1 py-16 sm:py-20">
        <SupportContainer />
      </div>
    </MarketingShell>
  );
}
