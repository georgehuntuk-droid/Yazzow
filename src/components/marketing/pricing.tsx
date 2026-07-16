import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck, Sparkles, TrendingUp } from "lucide-react";

import { SpotlightCard } from "@/components/brand/spotlight-card";
import type { MarketingAuthCta } from "@/lib/marketing/auth-cta";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

const plans = [
  {
    icon: BookOpen,
    name: SUBSCRIPTION_TIERS.starter.name,
    fee: "£10",
    feeSuffix: "per month",
    description: SUBSCRIPTION_TIERS.starter.description,
    highlights: [
      "Up to 10 active students",
      "Your private booking portal",
      "Automated email reminders",
      "Parent reporting dashboard",
      "Automated Cancellation Filler",
      "0% per-lesson platform fee",
      "Instant slot alerts included",
    ],
    featured: false,
  },
  {
    icon: TrendingUp,
    name: SUBSCRIPTION_TIERS.growth.name,
    fee: "£25",
    feeSuffix: "per month",
    description: SUBSCRIPTION_TIERS.growth.description,
    highlights: [
      "Up to 25 active students",
      "Your private booking portal",
      "Automated email reminders",
      "Parent reporting dashboard",
      "Automated Cancellation Filler",
      "0% per-lesson platform fee",
      "Instant slot alerts included",
    ],
    featured: false,
  },
  {
    icon: Sparkles,
    name: SUBSCRIPTION_TIERS.academy.name,
    fee: "£50",
    feeSuffix: "per month",
    description: SUBSCRIPTION_TIERS.academy.description,
    highlights: [
      "Everything in Growth",
      "Multi-Tutor Management (5 sub-accounts)",
      "Custom branding & theme options",
      "Your private booking portal",
      "0% per-lesson platform fee",
      "Instant slot alerts included",
    ],
    featured: true,
  },
] as const;

type MarketingPricingProps = {
  authCta: MarketingAuthCta;
};

export function MarketingPricing({ authCta }: MarketingPricingProps) {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="yazz-container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="yazz-section-label">Pricing</p>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Simple, transparent pricing.
          </h2>
          <p className="mt-4 yazz-muted">
            Choose the plan that fits your business scale. All tiers feature unlimited bookings, 0% platform fees, and a 14-day free trial.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3 items-stretch pt-4">
          {plans.map((plan) => {
            const featured = "featured" in plan && plan.featured;
            return (
              <SpotlightCard
                key={plan.name}
                className={`flex flex-col p-8 relative transition-all duration-300 ${
                  featured
                    ? "md:-translate-y-4 ring-4 ring-primary/30 shadow-[0_32px_64px_oklch(0.55_0.18_250/0.25)] border-primary/20 z-10"
                    : "border-border/60 hover:border-primary/20"
                }`}
              >
                {featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-xs font-black text-white shadow-md uppercase tracking-wider select-none animate-pulse">
                    Recommended
                  </span>
                ) : null}
                <div className={`mb-5 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ring-1 transition duration-300 ${
                  featured
                    ? "from-primary/25 to-primary/5 text-primary ring-primary/30"
                    : "from-primary/15 to-primary/5 text-primary ring-primary/10"
                }`}>
                  <plan.icon className="size-6" />
                </div>
                <h3 className="font-heading text-xl font-black tracking-tight text-foreground">{plan.name}</h3>
                
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="font-heading text-4xl font-black yazz-gradient-text">{plan.fee}</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {plan.feeSuffix}
                  </span>
                  <span className="ml-auto inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    14-Day Free Trial
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_6px_oklch(0.42_0.15_286/0.6)] mt-1.5"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={authCta.href}
                  className={`group mt-8 inline-flex h-11 w-full items-center justify-center gap-2 px-4 text-sm ${
                    featured ? "yazz-btn-primary" : "yazz-btn-secondary"
                  }`}
                >
                  {authCta.label}
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
              </SpotlightCard>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-lg text-center text-sm text-muted-foreground">
          Stripe processing fees apply separately on card payments.{" "}
          <Link
            href={authCta.href}
            className="group inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            {authCta.label}
            <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </p>
      </div>
    </section>
  );
}
