import { MarketingComparison } from "@/components/marketing/comparison";
import { MarketingSlotAlerts } from "@/components/marketing/slot-alerts";
import { MarketingCta } from "@/components/marketing/cta";
import { MarketingFeatures } from "@/components/marketing/features";
import { MarketingHero } from "@/components/marketing/hero";
import { MarketingHowItWorks } from "@/components/marketing/how-it-works";
import { MarketingPricing } from "@/components/marketing/pricing";
import { MarketingSocialProof } from "@/components/marketing/social-proof";
import { MarketingTestimonials } from "@/components/marketing/testimonials";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getMarketingAuthCta } from "@/lib/marketing/auth-cta";

export default async function HomePage() {
  const authCta = await getMarketingAuthCta();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <MarketingHero authCta={authCta} />
        <MarketingSlotAlerts authCta={authCta} />
        <MarketingSocialProof authCta={authCta} />
        <MarketingFeatures authCta={authCta} />
        <MarketingHowItWorks />
        <MarketingComparison />
        <MarketingPricing authCta={authCta} />
        <MarketingTestimonials />
        <MarketingCta authCta={authCta} />
      </main>
      <SiteFooter />
    </>
  );
}
