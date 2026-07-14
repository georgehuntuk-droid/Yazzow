import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CreditCard,
  Shield,
  Sparkles,
  BookOpen,
  GraduationCap,
  Pencil,
  Calculator,
  Trophy,
  CheckCircle2,
} from "lucide-react";

import { HeroPreview } from "@/components/brand/hero-preview";
import { TUTOR_PUBLIC_PATH } from "@/lib/constants";
import type { MarketingAuthCta } from "@/lib/marketing/auth-cta";

export function PortalPreviewMockup() {
  return (
    <div className="relative w-full max-w-[440px] mx-auto min-h-[440px] lg:min-h-[460px]">
      {/* Background Glow Backdrop */}
      <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-blue-500/20 to-indigo-500/10 blur-3xl opacity-80" aria-hidden />

      {/* Card 1: Calendar Availability Grid (Under/Left Layer) */}
      <div className="absolute -left-4 top-10 z-0 w-[240px] rounded-2xl border border-border/40 bg-card/60 p-4 shadow-md backdrop-blur-sm transition-transform duration-500 hover:scale-105 hidden sm:block">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weekly Slots</p>
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between rounded-lg bg-background/50 p-2 text-xs">
            <span className="font-medium">Mon 4:00 PM</span>
            <span className="font-semibold text-primary">Booked</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs text-emerald-700 dark:text-emerald-400">
            <span className="font-medium">Tue 5:00 PM</span>
            <span className="font-bold">Open</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background/50 p-2 text-xs">
            <span className="font-medium">Wed 4:00 PM</span>
            <span className="font-semibold text-primary">Booked</span>
          </div>
        </div>
      </div>

      {/* Card 2: Main Tutor Portal Preview (Center Layer) */}
      <div className="yazz-surface relative z-10 overflow-hidden p-1.5 shadow-[0_24px_64px_oklch(0.55_0.18_250/0.15)] ring-4 ring-blue-500/5 rounded-3xl border-blue-100/40 w-full">
        <div className="absolute inset-x-0 top-0 h-px yazz-shimmer opacity-60" aria-hidden />
        <div className="rounded-[calc(var(--radius-xl)-2px)] bg-gradient-to-b from-card via-card to-blue-50/10 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-400 via-blue-500 to-indigo-600 font-heading text-base font-black text-white shadow-sm rotate-3">
                MC
              </div>
              <div>
                <p className="font-heading text-base font-black tracking-tight text-foreground">Maya Chen</p>
                <p className="text-xs font-medium text-muted-foreground">GCSE Maths · Fun, friendly sessions</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/15">
              Your Portal
            </span>
          </div>

          <div className="mb-4 rounded-xl border border-blue-500/10 bg-background/90 p-3 shadow-inner">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-500/80">Your direct link</p>
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
                    ? "border-blue-500/30 bg-blue-500/8 shadow-[0_4px_16px_oklch(0.55_0.18_250/0.12)] ring-1 ring-blue-500/15"
                    : "border-border bg-card hover:border-blue-500/20 hover:bg-blue-500/5 hover:shadow-sm"
                }`}
              >
                <p className="text-xs font-semibold text-muted-foreground">{slot.label}</p>
                <p className="text-sm font-black text-blue-600 dark:text-blue-400">{slot.price}</p>
                {slot.opened ? (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    <Bell className="size-3" aria-hidden />
                    Just reopened!
                  </p>
                ) : null}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-[11px] leading-snug text-muted-foreground">
            <Bell className="mt-0.5 size-3.5 shrink-0 text-blue-500" aria-hidden />
            <span>
              <span className="font-bold text-foreground">Slot Alert!</span> — 2 families
              notified instantly when a cancellation freed Friday 10am.
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-muted-foreground">
            <Shield className="size-3.5 shrink-0 text-blue-500" />
            Private page — 100% focused on you
          </div>
        </div>
      </div>

      {/* Card 3: Stripe Payment Notification (Over/Right Layer) */}
      <div className="absolute -right-4 -bottom-4 z-20 w-[260px] rounded-2xl border border-emerald-500/10 bg-card/95 p-3.5 shadow-xl backdrop-blur-md ring-1 ring-emerald-500/20 transition-transform duration-500 hover:scale-105 hidden sm:flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Payment Processed</p>
          <p className="truncate text-xs font-bold text-foreground">GCSE Maths (Upfront)</p>
          <p className="text-[11px] font-medium text-muted-foreground">£45.00 · Maya Chen</p>
        </div>
      </div>
    </div>
  );
}

export function MarketingHero({ authCta }: { authCta: MarketingAuthCta }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-14">
      {/* Background Layout grid and gradient */}
      <div aria-hidden className="yazz-grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,black,transparent)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-20 size-96 rounded-full bg-primary/15 blur-[100px]"
        style={{ animation: "yazz-pulse-glow 8s ease-in-out infinite" }}
      />

      {/* Floating Tutoring / Educational Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block select-none" aria-hidden="true">
        {/* Book Icon - Left Floating */}
        <div className="absolute left-[3%] top-[20%] text-blue-500/15" style={{ animation: "yazz-float 8s ease-in-out infinite" }}>
          <BookOpen className="size-9 rotate-12" />
        </div>
        {/* Graduation Cap - Left Lower Floating */}
        <div className="absolute left-[5%] top-[68%] text-indigo-500/15" style={{ animation: "yazz-float 9s ease-in-out 1.5s infinite" }}>
          <GraduationCap className="size-11 -rotate-12" />
        </div>
        {/* Pencil - Left Mid Floating */}
        <div className="absolute left-[22%] top-[8%] text-rose-500/15" style={{ animation: "yazz-float 7s ease-in-out 0.5s infinite" }}>
          <Pencil className="size-7 rotate-45" />
        </div>
        {/* Calculator - Right Upper Floating */}
        <div className="absolute right-[40%] top-[12%] text-emerald-500/15" style={{ animation: "yazz-float 8.5s ease-in-out 2s infinite" }}>
          <Calculator className="size-9 -rotate-6" />
        </div>
        {/* Trophy - Right Lower Floating */}
        <div className="absolute right-[5%] top-[68%] text-amber-500/15" style={{ animation: "yazz-float 10s ease-in-out 1s infinite" }}>
          <Trophy className="size-10 rotate-12" />
        </div>
        {/* Sparkles - Right Mid Floating */}
        <div className="absolute right-[4%] top-[24%] text-blue-500/15" style={{ animation: "yazz-float 7.5s ease-in-out 0.8s infinite" }}>
          <Sparkles className="size-8 animate-pulse" />
        </div>
      </div>

      <div className="yazz-container relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="yazz-fade-in yazz-eyebrow mb-6 border-blue-200 bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Sparkles className="size-3.5 animate-pulse" />
              Private Booking Pages · Built for Independent Tutors
            </p>
            <h1 className="yazz-fade-in yazz-fade-in-delay-1 text-[2.75rem] font-black leading-[1.1] tracking-tight sm:text-[3rem] lg:text-[4rem] selection:bg-blue-100">
              Spend less time on admin.{" "}
              <span className="yazz-gradient-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600">
                Spend more time teaching.
              </span>
            </h1>
            <p className="yazz-fade-in yazz-fade-in-delay-2 mt-5 max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
              The simple booking portal, smart calendar, and automatic slot alert system custom-built for independent tutors. Take 100% upfront payments, keep your hours filled, and automate lesson cancellation headaches.
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
            {!authCta.href.includes("payments") && (
              <p className="yazz-fade-in yazz-fade-in-delay-3 mt-3 text-xs text-muted-foreground">
                No credit card required. Try a 14-day free trial now.
              </p>
            )}

            <dl className="yazz-fade-in yazz-fade-in-delay-4 mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { icon: Bell, label: "Slot Alerts", value: "Instant rebooking" },
                { icon: CalendarDays, label: "Bookings", value: "Paid upfront" },
                {
                  icon: CreditCard,
                  label: "Platform Cut",
                  value: "0% commission",
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
            <HeroPreview>
              <PortalPreviewMockup />
            </HeroPreview>
          </div>
        </div>
      </div>
    </section>
  );
}

