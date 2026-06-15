import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck, Sparkles } from "lucide-react";

import { SpotlightCard } from "@/components/brand/spotlight-card";
import type { MarketingAuthCta } from "@/lib/marketing/auth-cta";
import { TUTOR_SUBSCRIPTION } from "@/lib/constants";

const plans = [
  {
    icon: Sparkles,
    name: "Tutor plan",
    fee: TUTOR_SUBSCRIPTION.label,
    feeSuffix: "for you",
    description:
      "Run your private portal, accept lesson bookings, and manage students. No per-lesson platform fee.",
    highlights: [
      "Instant slot alerts included",
      "100% of lesson price to you",
      "Cancel anytime",
    ],
    featured: true,
  },
  {
    icon: CalendarCheck,
    name: "Lesson bookings",
    fee: "0%",
    feeSuffix: "Yazzow fee per booking",
    description:
      "Parents pay your lesson price upfront. You keep the full amount (Stripe processing applies as usual).",
    highlights: ["Paid upfront at booking", "Parent cancel links", "Slot alerts to waiting families"],
  },
  {
    icon: BookOpen,
    name: "Digital packs",
    fee: "List",
    feeSuffix: "on your shelf",
    description:
      "Showcase PDF or DOCX packs on your portal. Parents message you — you sell and deliver on your own terms.",
    highlights: ["No extra Stripe for packs", "Your pricing", "You handle payment"],
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
            One simple subscription.
          </h2>
          <p className="mt-4 yazz-muted">
            Tutors pay {TUTOR_SUBSCRIPTION.label} to run their business on Yazzow. Lesson bookings
            use Stripe Connect on your portal; worksheet packs are listed for parents to enquire.
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
                <p className="mt-2 font-heading text-4xl font-black yazz-gradient-text">
                  {plan.fee}
                  <span className="ml-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {plan.feeSuffix}
                  </span>
                </p>
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
                {featured ? (
                  <Link
                    href={authCta.href}
                    className="yazz-btn-primary group mt-8 inline-flex h-11 w-full items-center justify-center gap-2 px-4 text-sm"
                  >
                    {authCta.label}
                    <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </Link>
                ) : null}
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
