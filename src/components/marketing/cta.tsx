import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BRAND_NAME } from "@/lib/constants";
import type { MarketingAuthCta } from "@/lib/marketing/auth-cta";

export function MarketingCta({ authCta }: { authCta: MarketingAuthCta }) {
  return (
    <section className="py-20 sm:py-28">
      <div className="yazz-container">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-secondary/50 px-8 py-14 text-center shadow-[0_24px_64px_oklch(0.42_0.15_286/0.15)] sm:px-16 sm:py-20">
          <div aria-hidden className="yazz-grid-bg absolute inset-0 opacity-30" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-[oklch(0.52_0.17_286/0.15)] blur-2xl"
          />
          <div className="relative">
            <p className="yazz-section-label mb-4">Get started today</p>
            <h2 className="font-heading text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Ready to open your new classroom?
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base yazz-muted sm:text-lg">
              Set up your custom link, personalize your portal with your favorite accent colors, 
              and enjoy a stress-free business home built with love for educators.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={authCta.href} className="yazz-btn-primary group h-12 px-8">
                {authCta.label}
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <Link href="/tutor/demo" className="yazz-btn-secondary h-12 px-8">
                Preview {BRAND_NAME}
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              {!authCta.href.includes("payments") 
                ? "No credit card required · Try a 14-day free trial now"
                : "No credit card required · Free forever to set up your portal"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
