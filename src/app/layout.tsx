import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { BRAND_NAME, PUBLIC_SITE_URL } from "@/lib/constants";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: {
    default: `${BRAND_NAME} · The business home for independent tutors`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "White-labeled scheduling, digital worksheet storefront, and student CRM for independent tutors. No public marketplace — build your private teaching brand.",
  keywords: [
    "tutor scheduling software",
    "private tutor platform",
    "white label tutoring",
    "tutor billing website",
    "worksheet storefront",
    "independent educator software",
    "tutor business tool",
    "student CRM",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${BRAND_NAME} · The business home for independent tutors`,
    description:
      "White-labeled scheduling, digital worksheet storefront, and student CRM for independent tutors. Build your private brand without a marketplace taking a cut.",
    url: PUBLIC_SITE_URL,
    siteName: BRAND_NAME,
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: `${BRAND_NAME} Logo`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} · The business home for independent tutors`,
    description:
      "White-labeled scheduling, digital worksheet storefront, and student CRM for independent tutors. Build your private brand.",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} min-h-screen antialiased`}>
      <body className="min-h-screen flex flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
