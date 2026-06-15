import { Bell, Link2, Palette, Wallet } from "lucide-react";

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
    icon: Bell,
    title: "Cancellations refill themselves",
    description:
      "When a parent frees a slot, Yazzow emails your waiting families and updates your live calendar. Less chasing, more booked hours.",
  },
  {
    step: "04",
    icon: Wallet,
    title: "Get paid upfront",
    description:
      "Lessons are paid before they happen on your portal. List worksheet packs on your shelf — parents message you to buy outside Yazzow.",
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

        <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div
            aria-hidden
            className="absolute left-[12.5%] right-[12.5%] top-12 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block"
          />
          {steps.map((item) => (
            <li key={item.step} className="relative group">
              <SpotlightCard className="flex h-full flex-col p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                <div className="mb-5 flex items-center justify-between">
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-primary ring-1 ring-primary/15 uppercase select-none">
                    Step {item.step}
                  </span>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-110">
                    <item.icon className="size-5" />
                  </div>
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">{item.title}</h3>
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
