import { Sparkles } from "lucide-react";

const stats = [
  { value: "2%", label: "on lesson bookings" },
  { value: "5%", label: "on digital packs" },
  { value: "£0", label: "monthly subscription" },
  { value: "100%", label: "your brand, your link" },
] as const;

export function MarketingSocialProof() {
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
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group text-center transition duration-300 hover:-translate-y-1"
            >
              <dt className="text-3xl font-bold tracking-normal yazz-gradient-text sm:text-4xl">
                {stat.value}
              </dt>
              <dd className="mt-1 text-xs text-muted-foreground transition group-hover:text-foreground sm:text-sm">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
