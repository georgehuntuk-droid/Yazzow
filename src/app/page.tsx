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

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <MarketingHero />
        <MarketingSlotAlerts />
        <MarketingSocialProof />
        <MarketingFeatures />
        <MarketingHowItWorks />
        <MarketingComparison />
        <MarketingPricing />
        <MarketingTestimonials />
        <MarketingCta />
      </main>
      <SiteFooter />
    </>
  );
}
