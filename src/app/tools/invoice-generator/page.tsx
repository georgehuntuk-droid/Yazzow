import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { InvoiceGeneratorClient } from "./invoice-generator-client";
import { BRAND_NAME, PUBLIC_SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Free Tutor Invoice Generator | Create Professional PDF Invoices",
  description: "Generate and download beautifully styled invoice PDFs for your tutoring business instantly. 100% free, customizable, and no sign-up required.",
  keywords: [
    "tutor invoice generator",
    "free invoice template for tutors",
    "private tutor invoice maker",
    "tutoring session billing sheet",
    "independent tutor invoicing",
  ],
  alternates: {
    canonical: "/tools/invoice-generator",
  },
  openGraph: {
    title: `Free Tutor Invoice Generator · ${BRAND_NAME}`,
    description: "Generate and download beautifully styled invoice PDFs for your tutoring business instantly. 100% free, customizable, and no sign-up required.",
    url: `${PUBLIC_SITE_URL}/tools/invoice-generator`,
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
    title: `Free Tutor Invoice Generator · ${BRAND_NAME}`,
    description: "Generate and download beautifully styled invoice PDFs for your tutoring business instantly. 100% free, customizable, and no sign-up required.",
    images: ["/icon.png"],
  },
};

export default function InvoiceGeneratorPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-background">
        <InvoiceGeneratorClient />
      </main>
      <SiteFooter />
    </>
  );
}
