import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck } from "lucide-react";

import { SpotlightCard } from "@/components/brand/spotlight-card";
import { PLATFORM_FEES } from "@/lib/constants";

const plans = [
  {
    icon: CalendarCheck,
    name: "Lesson bookings",
    fee: `${PLATFORM_FEES.lessonBookingPercent}%`,
    description: "Parents pay 100% upfront when they book a slot. You keep the rest after the platform fee.",
    highlights: ["Recurring or one-off slots", "Automatic Stripe payouts", "No monthly fee"],
  },
  {
    icon: BookOpen,
    name: "Digital packs",
    fee: `${PLATFORM_FEES.digitalGoodsPercent}%`,
    description: "Upload PDF or DOCX worksheet packs with cover art. Secure download after checkout.",
    highlights: ["Instant delivery", "Your pricing", "Cover art & descriptions"],
    featured: true,
  },
] as const;

export function MarketingPricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="yazz-container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="yazz-section-label">Pricing</p>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Free to join. Pay only when you earn.
          </h2>
          <p className="mt-4 yazz-muted">
            No subscriptions, no setup fees. Platform fees are collected automatically at checkout
            through Stripe Connect.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const featured = "featured" in plan && plan.featured;
            return (
              <SpotlightCard
                key={plan.name}
                className={`flex flex-col p-8 ${featured ? "md:-translate-y-2 ring-2 ring-primary/25" : ""}`}
              >
                {featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_oklch(0.42_0.15_286/0.3)]">
                    Popular add-on
                  </span>
                ) : null}
                <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/15">
                  <plan.icon className="size-6" />
                </div>
                <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                <p className="mt-2 font-heading text-4xl font-bold yazz-gradient-text">
                  {plan.fee}
                  <span className="ml-1 text-base font-normal text-muted-foreground">per sale</span>
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
                <ul className="mt-6 flex-1 space-y-2">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_6px_oklch(0.42_0.15_286/0.6)]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-lg text-center text-sm text-muted-foreground">
          Stripe processing fees apply separately, as with any payment provider.{" "}
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Start for free
            <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </p>
      </div>
    </section>
  );
}
