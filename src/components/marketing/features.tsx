import Link from "next/link";
import { ArrowRight, Bell, BookOpen, CalendarRange, Undo2, Users } from "lucide-react";

import { SpotlightCard } from "@/components/brand/spotlight-card";
import type { MarketingAuthCta } from "@/lib/marketing/auth-cta";
import { TUTOR_SUBSCRIPTION } from "@/lib/constants";

const features = [
  {
    icon: Bell,
    title: "Instant slot alerts",
    description:
      "When a lesson is cancelled, every family on your list gets emailed. Your portal calendar updates live — empty hours get filled faster.",
    featured: true,
  },
  {
    icon: Undo2,
    title: "Parent self-cancel",
    description:
      "Parents cancel from a link in their booking email. The hour reopens automatically and triggers alerts — no back-and-forth messages.",
    featured: true,
  },
  {
    icon: CalendarRange,
    title: "Schedule builder",
    description:
      "Set recurring weekly hours or open individual blocks. Parents see only your real availability.",
  },
  {
    icon: BookOpen,
    title: "Your portal & shelf",
    description:
      "Upload PDF or DOCX packs with cover art, descriptions, and guide prices. Parents contact you to buy.",
  },
  {
    icon: Users,
    title: "Student ledger",
    description:
      "A lightweight CRM: student names, parent emails, lesson history, and revenue per family.",
  },
] as const;

export function MarketingFeatures({ authCta }: { authCta: MarketingAuthCta }) {
  return (
    <section id="features" className="relative border-y border-border/50 bg-card/40 py-20 sm:py-28">
      <div className="yazz-container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="yazz-section-label">Features</p>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Built to fill your diary, not just take bookings
          </h2>
          <p className="mt-4 yazz-muted">
            Cancellations happen — {TUTOR_SUBSCRIPTION.label} includes smart slot alerts so other
            pupils hear the moment a time opens. Plus portal, ledger, and a worksheet shelf you sell
            yourself.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <SpotlightCard
              key={feature.title}
              className={`p-6 ${"featured" in feature && feature.featured ? "ring-1 ring-primary/20" : ""}`}
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/15 transition duration-300 group-hover:scale-110 group-hover:shadow-[0_4px_16px_oklch(0.42_0.15_286/0.2)]">
                <feature.icon className="size-5" />
              </div>
              {"featured" in feature && feature.featured ? (
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  Popular with tutors
                </p>
              ) : null}
              <h3 className="font-heading text-xl font-bold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </SpotlightCard>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center">
          <Link
            href="/#slot-alerts"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            See how slot alerts work
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
          <span className="hidden text-muted-foreground sm:inline" aria-hidden>
            ·
          </span>
          <Link
            href={authCta.href}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            {authCta.label}
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
