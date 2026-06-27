import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BRAND_NAME, PUBLIC_SITE_URL } from "@/lib/constants";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function getMetadataBase(): URL {
  try {
    const urlStr = PUBLIC_SITE_URL.trim();
    const withProto = urlStr.startsWith("http://") || urlStr.startsWith("https://") 
      ? urlStr 
      : `https://${urlStr}`;
    return new URL(withProto);
  } catch {
    return new URL("https://www.yazzow.com");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  manifest: "/manifest.json?v=3",
  icons: {
    icon: "/icon.png?v=3",
    apple: "/icon.png?v=3",
  },
  verification: {
    google: "3Cc3_pbbhitfL-m_TACF19q_Gj-NKzbQBQUTrKRselI",
  },
  title: {
    default: `${BRAND_NAME} · The business home for independent tutors`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "Tutor-pupil management, lesson scheduling, and digital worksheet storefront for independent tutors. No public marketplace — build your private teaching brand.",
  keywords: [
    "tutor scheduling software",
    "private tutor platform",
    "tutor pupil management",
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
      "Tutor-pupil management, lesson scheduling, and digital worksheet storefront for independent tutors. Build your private brand without a marketplace taking a cut.",
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
      "Tutor-pupil management, lesson scheduling, and digital worksheet storefront for independent tutors. Build your private brand.",
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

import { PwaInstallBanner } from "@/components/dashboard/pwa-install-banner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} min-h-screen antialiased`}>
      <body className="min-h-screen flex flex-col font-sans">
        {children}
        <PwaInstallBanner />
        <Analytics />
        <SpeedInsights />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) { console.log('SW registered:', reg.scope); },
                    function(err) { console.log('SW reg failed:', err); }
                  );
                });
              }
              window.deferredPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.deferredPrompt = e;
                window.dispatchEvent(new CustomEvent('pwa-can-install'));
              });
              window.addEventListener('appinstalled', function() {
                window.deferredPrompt = null;
                window.dispatchEvent(new CustomEvent('pwa-installed'));
              });
            `
          }}
        />
      </body>
    </html>
  );
}
