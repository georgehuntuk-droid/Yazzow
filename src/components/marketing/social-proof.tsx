import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import type { MarketingAuthCta } from "@/lib/marketing/auth-cta";
import { TUTOR_SUBSCRIPTION } from "@/lib/constants";

const stats = [
  { value: "Instant", label: "slot alert emails" },
  { value: "0%", label: "commission per sale" },
  { value: "100%", label: "of lesson price to you" },
  { value: TUTOR_SUBSCRIPTION.label, label: "tutor subscription" },
] as const;

type MarketingSocialProofProps = {
  authCta: MarketingAuthCta;
};

export function MarketingSocialProof({ authCta }: MarketingSocialProofProps) {
  return (
    <section className="border-y border-border/50 bg-gradient-to-r from-primary/5 via-card/50 to-primary/5 py-12">
      <div className="yazz-container">
        <div className="mb-10 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-3">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">
            Built for solo tutors who want a professional home — not another marketplace profile
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat) => {
            const isSubscription = stat.label === "tutor subscription";
            const content = (
              <>
                <dt className="text-3xl font-bold tracking-normal yazz-gradient-text sm:text-4xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground transition group-hover:text-foreground sm:text-sm">
                  {stat.label}
                  {isSubscription ? (
                    <ArrowRight
                      className="size-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  ) : null}
                </dd>
              </>
            );

            if (isSubscription) {
              return (
                <Link
                  key={stat.label}
                  href={authCta.href}
                  className="group block rounded-2xl text-center transition duration-300 hover:-translate-y-1 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={stat.label}
                className="group text-center transition duration-300 hover:-translate-y-1"
              >
                {content}
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
