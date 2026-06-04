import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, CreditCard, Shield, Sparkles } from "lucide-react";

import { HeroPreview } from "@/components/brand/hero-preview";
import { BRAND_NAME, TUTOR_PUBLIC_PATH, TUTOR_SUBSCRIPTION } from "@/lib/constants";
import type { MarketingAuthCta } from "@/lib/marketing/auth-cta";

export function PortalPreviewMockup() {
  return (
    <div className="yazz-surface relative overflow-hidden p-1.5 shadow-[0_24px_64px_oklch(0.42_0.15_286/0.2)] ring-4 ring-rose-500/5 rounded-3xl border-rose-100/40">
      <div className="absolute inset-x-0 top-0 h-px yazz-shimmer opacity-60" aria-hidden />
      <div className="rounded-[calc(var(--radius-xl)-2px)] bg-gradient-to-b from-card via-card to-amber-50/20 p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-violet-500 font-heading text-base font-black text-white shadow-sm rotate-3">
              MC
            </div>
            <div>
              <p className="font-heading text-base font-black tracking-tight text-foreground">Maya Chen</p>
              <p className="text-xs font-medium text-muted-foreground">GCSE Maths · Fun, friendly sessions</p>
            </div>
          </div>
          <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/15">
            Your portal
          </span>
        </div>

        <div className="mb-4 rounded-xl border border-rose-500/10 bg-background/90 p-3 shadow-inner">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-rose-500/80">Your direct link</p>
          <code className="block truncate text-sm font-semibold text-foreground">
            yazzow.com{TUTOR_PUBLIC_PATH}/maya-chen
          </code>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Thu 4 Jun · 4pm", price: "£45" },
            { label: "Fri 5 Jun · 10am", price: "£45", opened: true },
          ].map((slot) => (
            <button
              key={slot.label}
              type="button"
              className={`rounded-2xl border px-3 py-2.5 text-left transition duration-200 ${
                slot.opened
                  ? "border-rose-500/30 bg-rose-500/8 shadow-[0_4px_16px_oklch(0.55_0.15_286/0.12)] ring-1 ring-rose-500/15"
                  : "border-border bg-card hover:border-rose-500/20 hover:bg-rose-500/5 hover:shadow-sm"
              }`}
            >
              <p className="text-xs font-semibold text-muted-foreground">{slot.label}</p>
              <p className="text-sm font-black text-rose-600 dark:text-rose-400">{slot.price}</p>
              {slot.opened ? (
                <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  <Bell className="size-3" aria-hidden />
                  Just reopened!
                </p>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-[11px] leading-snug text-muted-foreground">
          <Bell className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden />
          <span>
            <span className="font-bold text-foreground">Glow Alert!</span> — 2 families
            notified instantly when a cancellation freed Friday 10am.
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-muted-foreground">
          <Shield className="size-3.5 shrink-0 text-violet-500" />
          Private page — 100% focused on you
        </div>
      </div>
    </div>
  );
}

export function MarketingHero({ authCta }: { authCta: MarketingAuthCta }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-14">
      <div aria-hidden className="yazz-grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,black,transparent)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-20 size-96 rounded-full bg-primary/15 blur-[100px]"
        style={{ animation: "yazz-pulse-glow 8s ease-in-out infinite" }}
      />
      <div className="yazz-container relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p className="yazz-fade-in yazz-eyebrow mb-6 border-rose-300 bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Sparkles className="size-3.5" />
              Your classroom, your rules · No marketplace competition
            </p>
            <h1 className="yazz-fade-in yazz-fade-in-delay-1 text-[2.5rem] font-black leading-[1.15] tracking-tight sm:text-[2.75rem] lg:text-[3.5rem] selection:bg-amber-100">
              The cozy business home for{" "}
              <span className="yazz-gradient-text bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600">independent educators</span>
            </h1>
            <p className="yazz-fade-in yazz-fade-in-delay-2 mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {BRAND_NAME} is built for tutors who want a delightful space, not a sterile portal. 
              Get your own gorgeous shareable page. Parents book lessons, get instant cancellation 
              alerts, and buy your custom learning packs with zero hassle.
            </p>

            <div className="yazz-fade-in yazz-fade-in-delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={authCta.href} className="yazz-btn-primary group h-12 px-7">
                {authCta.label}
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <Link href="/tutor/demo" className="yazz-btn-secondary h-12 px-7">
                See a live portal
              </Link>
            </div>

            <dl className="yazz-fade-in yazz-fade-in-delay-4 mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { icon: Bell, label: "Slot alerts", value: "Instant email" },
                { icon: CalendarDays, label: "Bookings", value: "Paid upfront" },
                {
                  icon: CreditCard,
                  label: "Pricing",
                  value: `${TUTOR_SUBSCRIPTION.label} flat`,
                },
              ].map((item) => (
                <div key={item.label} className="yazz-panel group px-4 py-3.5">
                  <item.icon className="mb-2 size-4 text-primary transition group-hover:scale-110" />
                  <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
                  <dd className="font-heading text-sm font-bold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative lg:pl-4">
            <div
              aria-hidden
              className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-primary/25 via-transparent to-[oklch(0.52_0.17_286/0.15)] blur-3xl"
            />
            <HeroPreview>
              <PortalPreviewMockup />
            </HeroPreview>
          </div>
        </div>
      </div>
    </section>
  );
}
