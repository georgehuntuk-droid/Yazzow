import { Link2, Palette, Wallet } from "lucide-react";

import { SpotlightCard } from "@/components/brand/spotlight-card";

const steps = [
  {
    step: "01",
    icon: Palette,
    title: "Claim your portal",
    description:
      "Pick a username, add your photo and bio. Your page looks like your business — professional, calm, and entirely yours.",
  },
  {
    step: "02",
    icon: Link2,
    title: "Share one link",
    description:
      "Send parents a single URL for bookings and worksheet packs. No directory listing, no competing tutors beside you.",
  },
  {
    step: "03",
    icon: Wallet,
    title: "Get paid upfront",
    description:
      "Lessons are paid before they happen. Digital packs deliver instantly. Stripe Connect handles payouts with transparent fees.",
  },
] as const;

export function MarketingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="yazz-container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="yazz-section-label">How it works</p>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            From signup to first booking in an afternoon
          </h2>
          <p className="mt-4 yazz-muted">
            No complex setup. No waiting for marketplace approval. Just your link, your schedule,
            and your storefront.
          </p>
        </div>

        <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden
            className="absolute left-[16.67%] right-[16.67%] top-12 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block"
          />
          {steps.map((item) => (
            <li key={item.step} className="relative">
              <SpotlightCard className="flex h-full flex-col p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-heading text-4xl font-bold text-primary/25">
                    {item.step}
                  </span>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/15 transition group-hover:scale-110">
                    <item.icon className="size-5" />
                  </div>
                </div>
                <h3 className="font-heading text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </SpotlightCard>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
