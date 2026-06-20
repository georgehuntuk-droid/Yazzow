import { MarketingComparison } from "@/components/marketing/comparison";
import { MarketingSlotAlerts } from "@/components/marketing/slot-alerts";
import { MarketingAudience } from "@/components/marketing/audience";
import { MarketingCta } from "@/components/marketing/cta";
import { MarketingFeatures } from "@/components/marketing/features";
import { MarketingHero } from "@/components/marketing/hero";
import { MarketingHowItWorks } from "@/components/marketing/how-it-works";
import { MarketingPricing } from "@/components/marketing/pricing";
import { MarketingSocialProof } from "@/components/marketing/social-proof";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getMarketingAuthCta } from "@/lib/marketing/auth-cta";
import { redirect } from "next/navigation";
import { safeGetAuthUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { PUBLIC_SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yazzow · White-Label Private Tutor Booking Platform & CRM",
  description:
    "Yazzow is the ultimate booking platform and scheduling software for independent tutors. Manage student logs, automate lesson scheduling, handle invoices, and build your private teaching brand.",
  keywords: [
    "tutor booking platform",
    "private tutor scheduling website",
    "white label tutor software",
    "tutor scheduling software",
    "tutor CRM",
    "independent tutor tools",
    "online tutoring business software",
    "worksheet storefront",
  ],
  openGraph: {
    title: "Yazzow · White-Label Private Tutor Booking Platform & CRM",
    description:
      "Yazzow is the ultimate booking platform and scheduling software for independent tutors. Manage student logs, automate lesson scheduling, handle invoices, and build your private teaching brand.",
  },
  twitter: {
    title: "Yazzow · White-Label Private Tutor Booking Platform & CRM",
    description:
      "Yazzow is the ultimate booking platform and scheduling software for independent tutors. Manage student logs, automate lesson scheduling, handle invoices, and build your private teaching brand.",
  },
};

export default async function HomePage() {
  const user = isSupabaseConfigured() ? await safeGetAuthUser() : null;

  if (user) {
    redirect("/dashboard");
  }

  const authCta = await getMarketingAuthCta(user);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Yazzow",
    "url": PUBLIC_SITE_URL,
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "description": "White-labeled scheduling, digital worksheet storefront, and student CRM for independent tutors.",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "GBP"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <MarketingHero authCta={authCta} />
        <MarketingAudience />
        <MarketingSlotAlerts authCta={authCta} />
        <MarketingSocialProof authCta={authCta} />
        <MarketingFeatures authCta={authCta} />
        <MarketingHowItWorks />
        <MarketingComparison />
        <MarketingPricing authCta={authCta} />
        <MarketingCta authCta={authCta} />
      </main>
      <SiteFooter />
    </>
  );
}

