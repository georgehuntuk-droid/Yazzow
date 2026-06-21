import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { RateCalculatorClient } from "./rate-calculator-client";
import { BRAND_NAME, PUBLIC_SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tutor Hourly Rate Calculator | Work Out Your Tutoring Fees",
  description: "Calculate what you should charge per hour as a private tutor. Compare subject rates, experience levels, and location rates with our interactive calculator.",
  keywords: [
    "tutor hourly rate calculator",
    "private tutor price calculator",
    "how much to charge for tutoring UK",
    "GCSE tutor fees",
    "qualified teacher hourly tutoring rate",
  ],
  alternates: {
    canonical: "/tools/rate-calculator",
  },
  openGraph: {
    title: `Tutor Hourly Rate Calculator · ${BRAND_NAME}`,
    description: "Calculate what you should charge per hour as a private tutor. Compare subject rates, experience levels, and location rates with our interactive calculator.",
    url: `${PUBLIC_SITE_URL}/tools/rate-calculator`,
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: `${BRAND_NAME} Logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Tutor Hourly Rate Calculator · ${BRAND_NAME}`,
    description: "Calculate what you should charge per hour as a private tutor. Compare subject rates, experience levels, and location rates with our interactive calculator.",
    images: ["/icon.png"],
  },
};

export default function RateCalculatorPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-background">
        <RateCalculatorClient />
      </main>
      <SiteFooter />
    </>
  );
}
