import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck, Sparkles } from "lucide-react";

import { SpotlightCard } from "@/components/brand/spotlight-card";
import { PLATFORM_FEES, TUTOR_SUBSCRIPTION } from "@/lib/constants";

const plans = [
  {
    icon: Sparkles,
    name: "Tutor plan",
    fee: TUTOR_SUBSCRIPTION.label,
    feeSuffix: "for you",
    description:
      "Run your private portal, accept lesson bookings, and manage students. No per-lesson platform fee.",
    highlights: [
      "Unlimited portal & schedule",
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
    highlights: ["Paid upfront at booking", "Automatic Stripe payouts", "Included in tutor plan"],
  },
  {
    icon: BookOpen,
    name: "Digital packs",
    fee: `${PLATFORM_FEES.digitalGoodsPercent}%`,
    feeSuffix: "per sale",
    description:
      "Upload PDF or DOCX worksheet packs with cover art. Secure download after checkout.",
    highlights: ["Instant delivery", "Your pricing", "Fee only when you sell"],
  },
] as const;

export function MarketingPricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="yazz-container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="yazz-section-label">Pricing</p>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Simple subscription. Fair add-on fee.
          </h2>
          <p className="mt-4 yazz-muted">
            Tutors pay {TUTOR_SUBSCRIPTION.label} to run their business on Yazzow. Digital worksheet
            sales include a {PLATFORM_FEES.digitalGoodsPercent}% platform fee — collected at
            checkout via Stripe Connect.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const featured = "featured" in plan && plan.featured;
            return (
              <SpotlightCard
                key={plan.name}
                className={`flex flex-col p-8 ${featured ? "md:-translate-y-2 ring-2 ring-primary/25" : ""}`}
              >
                {featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_oklch(0.42_0.15_286/0.3)]">
                    For tutors
                  </span>
                ) : null}
                <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/15">
                  <plan.icon className="size-6" />
                </div>
                <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                <p className="mt-2 font-heading text-4xl font-bold yazz-gradient-text">
                  {plan.fee}
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    {plan.feeSuffix}
                  </span>
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
                <ul className="mt-6 flex-1 space-y-2">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_6px_oklch(0.42_0.15_286/0.6)]"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-lg text-center text-sm text-muted-foreground">
          Stripe processing fees apply separately on card payments.{" "}
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Start your portal
            <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </p>
      </div>
    </section>
  );
}
