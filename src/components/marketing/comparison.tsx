import { Check, X } from "lucide-react";

import { BRAND_NAME } from "@/lib/constants";

const rows = [
  {
    label: "Parents cancel & slot alerts",
    yazzow: true,
    marketplace: false,
  },
  {
    label: "Instant email when a slot opens",
    yazzow: true,
    marketplace: false,
  },
  {
    label: "Live calendar on your portal",
    yazzow: true,
    marketplace: "Rare",
  },
  {
    label: "Your own branded page",
    yazzow: true,
    marketplace: false,
  },
  {
    label: "Hidden from tutor directories",
    yazzow: true,
    marketplace: false,
  },
  {
    label: "Parents book only with you",
    yazzow: true,
    marketplace: false,
  },
  {
    label: "Sell digital worksheet packs",
    yazzow: true,
    marketplace: "Limited",
  },
  {
    label: "Student & revenue ledger",
    yazzow: true,
    marketplace: false,
  },
  {
    label: "Low platform fees",
    yazzow: true,
    marketplace: false,
  },
] as const;

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <Check className="size-4 shrink-0" aria-hidden />
        Yes
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <X className="size-4 shrink-0 opacity-60" aria-hidden />
        No
      </span>
    );
  }
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

export function MarketingComparison() {
  return (
    <section className="border-y border-border/50 bg-gradient-to-b from-primary/5 to-transparent py-20 sm:py-28">
      <div className="yazz-container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="yazz-section-label">Why tutors switch</p>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Your brand, not a crowded marketplace
          </h2>
          <p className="mt-4 yazz-muted">
            Marketplaces help you get discovered — then compete for attention. {BRAND_NAME} is the
            opposite: a private home for tutors who already have families and referrals.
          </p>
        </div>

        <div className="yazz-surface mx-auto max-w-3xl overflow-hidden ring-1 ring-primary/10">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-border/60 bg-gradient-to-r from-primary/10 via-muted/30 to-muted/30 px-4 py-4 text-sm font-semibold sm:px-6">
            <span className="text-muted-foreground">Feature</span>
            <span className="text-center yazz-gradient-text">{BRAND_NAME}</span>
            <span className="text-center text-muted-foreground">Typical marketplace</span>
          </div>
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1.4fr_1fr_1fr] items-center px-4 py-4 transition hover:bg-primary/5 sm:px-6 ${
                index !== rows.length - 1 ? "border-b border-border/40" : ""
              }`}
            >
              <span className="pr-4 text-sm font-medium">{row.label}</span>
              <div className="flex justify-center">
                <CellValue value={row.yazzow} />
              </div>
              <div className="flex justify-center">
                <CellValue value={row.marketplace} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
