import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookOpen, CalendarRange, Users } from "lucide-react";

import { SpotlightCard } from "@/components/brand/spotlight-card";
import { PLATFORM_FEES } from "@/lib/constants";

const features = [
  {
    icon: CalendarRange,
    title: "Schedule builder",
    description:
      "Set recurring weekly hours or open individual blocks. Parents see only your real availability.",
  },
  {
    icon: BookOpen,
    title: "Your portal",
    description:
      "Upload PDF or DOCX packs with cover art, descriptions, and prices. Secure delivery after checkout.",
  },
  {
    icon: Users,
    title: "Student ledger",
    description:
      "A lightweight CRM: student names, parent emails, lesson history, and revenue per family.",
  },
] as const;

export function MarketingFeatures() {
  return (
    <section id="features" className="relative border-y border-border/50 bg-card/40 py-20 sm:py-28">
      <div className="yazz-container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="yazz-section-label">Features</p>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Everything in one place
          </h2>
          <p className="mt-4 yazz-muted">
            Free to join. {PLATFORM_FEES.lessonBookingPercent}% on lesson bookings,{" "}
            {PLATFORM_FEES.digitalGoodsPercent}% on digital goods — collected automatically at
            checkout via Stripe Connect.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <SpotlightCard key={feature.title} className="p-6">
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/15 transition duration-300 group-hover:scale-110 group-hover:shadow-[0_4px_16px_oklch(0.42_0.15_286/0.2)]">
                <feature.icon className="size-5" />
              </div>
              <h3 className="font-heading text-xl font-bold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </SpotlightCard>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Create your free portal
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
