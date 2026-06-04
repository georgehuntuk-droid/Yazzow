import Link from "next/link";
import { ArrowRight, Bell, CalendarSync, Mail, Undo2 } from "lucide-react";

import { SpotlightCard } from "@/components/brand/spotlight-card";
import { BRAND_NAME } from "@/lib/constants";
import type { MarketingAuthCta } from "@/lib/marketing/auth-cta";

const flow = [
  {
    icon: Undo2,
    title: "Parent cancels online",
    description:
      "Families get a secure link in their booking email — no account needed. One tap frees the hour on your calendar.",
  },
  {
    icon: CalendarSync,
    title: "The slot reopens instantly",
    description:
      "Your dashboard and public portal update in real time. No manual admin, no chasing WhatsApp replies.",
  },
  {
    icon: Mail,
    title: "Waiting families are notified",
    description:
      "Everyone on your student list and alert list gets an email the moment a lesson time opens — ready to book.",
  },
] as const;

export function MarketingSlotAlerts({ authCta }: { authCta: MarketingAuthCta }) {
  return (
    <section
      id="slot-alerts"
      className="relative overflow-hidden border-y border-primary/15 bg-gradient-to-b from-primary/8 via-card/50 to-background py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/2 size-80 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="yazz-container relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="yazz-section-label mb-4 inline-flex items-center gap-2">
              <Bell className="size-3.5" />
              Flagship feature
            </p>
            <h2 className="font-heading text-3xl font-bold sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Cancelled lessons don&apos;t stay empty for long
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              When one family can&apos;t make a session, {BRAND_NAME} reopens the hour and{" "}
              <em className="font-medium text-foreground not-italic">
                alerts your other pupils immediately
              </em>{" "}
              — by email and on your live booking calendar. Less diary admin, fuller weeks.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Parents cancel from their confirmation email — you can still cancel from the dashboard too.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Families who joined your portal or booked before stay on the alert list automatically.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Portal visitors see the calendar refresh without refreshing the page.
              </li>
            </ul>
            <Link
              href={authCta.href}
              className="yazz-btn-primary group mt-10 inline-flex h-11 items-center gap-2 px-6"
            >
              {authCta.label}
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="space-y-4">
            {flow.map((step, index) => (
              <SpotlightCard key={step.title} className="relative p-5 sm:p-6">
                <div className="flex gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 text-primary ring-1 ring-primary/20">
                    <step.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                      Step {index + 1}
                    </p>
                    <h3 className="font-heading text-lg font-bold">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            ))}

            <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-center text-xs text-muted-foreground sm:text-sm">
              <span className="font-medium text-foreground">Example:</span> Thursday 4pm cancels at
              lunch → three families emailed by 12:05 → slot booked again by teatime.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
