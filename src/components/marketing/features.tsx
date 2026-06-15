"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarRange,
  CreditCard,
  Bell,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Mail,
  Sparkles,
  CheckCircle2,
  FileText,
  Clock,
} from "lucide-react";

import { SpotlightCard } from "@/components/brand/spotlight-card";
import type { MarketingAuthCta } from "@/lib/marketing/auth-cta";
import { BRAND_NAME } from "@/lib/constants";

const tabs = [
  {
    id: "calendar",
    icon: CalendarRange,
    title: "Smart Calendar Scheduling",
    shortDesc: "Set your weekly hours and let parents self-book or reschedule.",
    bullets: [
      "Real-time slot availability blocks",
      "Parents reschedule themselves without text tag",
      "Syncs instantly with your dashboard",
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Upfront Cash Flow",
    shortDesc: "Protect your income with 100% upfront card payments.",
    bullets: [
      "Stripe Connect integration on your portal",
      "Automatic receipts and invoice logs",
      "No commission cuts taken by Yazzow",
    ],
  },
  {
    id: "alerts",
    icon: Bell,
    title: "Auto-Filling Slot Alerts",
    shortDesc: "Instantly notify waitlists when lesson slots free up.",
    bullets: [
      "Zero admin required to fill cancellations",
      "Automatic email alerts sent to active families",
      "Reopens the hour on your booking page live",
    ],
  },
  {
    id: "shelf",
    icon: BookOpen,
    title: "Worksheet Storefront Shelf",
    shortDesc: "Showcase custom study guides, packs, and resources.",
    bullets: [
      "Upload PDF or DOCX booklets",
      "Custom price tags and storefront covers",
      "Direct parent enquiries sent to your email",
    ],
  },
] as const;

export function MarketingFeatures({ authCta }: { authCta: MarketingAuthCta }) {
  const [activeTab, setActiveTab] = useState<string>("calendar");

  return (
    <section id="features" className="relative border-y border-border/50 bg-card/40 py-20 sm:py-28 overflow-hidden">
      {/* Background glow element */}
      <div className="absolute right-0 top-1/4 size-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" aria-hidden />

      <div className="yazz-container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="yazz-section-label">All-in-one Hub</p>
          <h2 className="font-heading text-3xl font-black tracking-tight sm:text-4xl">
            Everything you need to run your tutoring
          </h2>
          <p className="mt-4 yazz-muted text-base">
            Forget about messy calendar spreadsheets, unpaid fees, and endless phone tag. {BRAND_NAME} automates the admin work so you can concentrate on teaching.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 items-center">
          {/* Left Side: Tabs */}
          <div className="space-y-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onMouseEnter={() => setActiveTab(tab.id)}
                  className={`group relative cursor-pointer rounded-2xl border p-5 transition-all duration-300 text-left select-none ${
                    isActive
                      ? "border-primary/30 bg-primary/8 shadow-[0_8px_32px_oklch(0.55_0.18_250/0.08)] ring-1 ring-primary/15"
                      : "border-border/60 bg-transparent hover:border-primary/20 hover:bg-primary/5"
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveTab(tab.id);
                    }
                  }}
                >
                  {/* Left accent line for active state */}
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r-md transition-all duration-300 ${
                      isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50"
                    }`}
                  />
                  <div className="flex gap-4">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 transition duration-300 ${
                      isActive
                        ? "from-primary/20 to-primary/5 text-primary ring-primary/25"
                        : "from-muted/40 to-muted/10 text-muted-foreground ring-border/50 group-hover:text-primary group-hover:ring-primary/20"
                    }`}>
                      <tab.icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                        {tab.title}
                        {isActive && <Sparkles className="size-3.5 text-primary animate-pulse" />}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{tab.shortDesc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side: Interactive Mockup Display */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 blur-3xl" aria-hidden />

            <div className="yazz-surface relative overflow-hidden p-6 shadow-xl border-blue-100/40 rounded-3xl min-h-[380px] flex flex-col justify-between transition-all duration-500">
              {/* Simulated Screen Content based on Active Tab */}
              {activeTab === "calendar" && (
                <div className="flex flex-col h-full justify-between animate-in fade-in duration-300">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2">
                      <Clock className="size-3.5" />
                      Live Booking Calendar
                    </div>
                    <h4 className="font-heading text-base font-bold text-foreground">Select a lesson slot</h4>
                    <p className="text-xs text-muted-foreground">Times displayed in London/Europe timezone</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-2">
                    <div className="rounded-xl border border-border bg-muted/40 p-2.5 text-left opacity-70">
                      <p className="text-[10px] font-bold text-muted-foreground">Mon 4 Jun</p>
                      <p className="text-xs font-semibold mt-0.5">4:00 PM - 5:00 PM</p>
                      <span className="mt-1 inline-block rounded bg-muted-foreground/10 px-1 text-[9px] font-bold text-muted-foreground">Booked</span>
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-left ring-1 ring-primary/15 transition hover:bg-primary/8 cursor-pointer">
                      <p className="text-[10px] font-bold text-primary">Tue 5 Jun</p>
                      <p className="text-xs font-bold mt-0.5">5:00 PM - 6:00 PM</p>
                      <span className="mt-1 inline-block rounded bg-emerald-500/10 px-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Available</span>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/40 p-2.5 text-left opacity-70">
                      <p className="text-[10px] font-bold text-muted-foreground">Wed 6 Jun</p>
                      <p className="text-xs font-semibold mt-0.5">4:00 PM - 5:00 PM</p>
                      <span className="mt-1 inline-block rounded bg-muted-foreground/10 px-1 text-[9px] font-bold text-muted-foreground">Booked</span>
                    </div>

                    <div className="rounded-xl border border-primary/15 bg-card hover:bg-primary/5 p-2.5 text-left cursor-pointer transition">
                      <p className="text-[10px] font-bold text-muted-foreground">Thu 7 Jun</p>
                      <p className="text-xs font-bold mt-0.5">3:00 PM - 4:00 PM</p>
                      <span className="mt-1 inline-block rounded bg-emerald-500/10 px-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Available</span>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Selected: Tue 5 Jun at 5:00 PM</span>
                    <button className="rounded-lg bg-primary px-3 py-1.5 font-bold text-white shadow-sm hover:bg-[oklch(0.50_0.18_250)] transition">
                      Book Slot
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="flex flex-col h-full justify-between animate-in fade-in duration-300">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                      <ShieldCheck className="size-3.5" />
                      Upfront Payments Secured
                    </div>
                    <h4 className="font-heading text-base font-bold text-foreground">Secure Checkout</h4>
                    <p className="text-xs text-muted-foreground">Lesson confirmed automatically upon payment</p>
                  </div>

                  <div className="my-3 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/5 to-transparent p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">1 hr Private Session</span>
                      <span className="text-sm font-bold text-foreground">£45.00</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border/50 pt-2">
                      <span className="text-xs font-bold text-foreground">Total</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">£45.00</span>
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-4" />
                      Visa ending in 4242 charged successfully
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4 text-center text-[10px] text-muted-foreground leading-snug">
                    🔒 Paid directly to your Stripe account. 0% platform commission fees.
                  </div>
                </div>
              )}

              {activeTab === "alerts" && (
                <div className="flex flex-col h-full justify-between animate-in fade-in duration-300">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">
                      <Mail className="size-3.5" />
                      Instant Waitlist Email
                    </div>
                    <h4 className="font-heading text-base font-bold text-foreground">Auto-Cancellation Alert</h4>
                    <p className="text-xs text-muted-foreground">Rebooks in minutes without manual messaging</p>
                  </div>

                  <div className="my-2 rounded-2xl border border-blue-500/10 bg-background p-4 shadow-sm text-left">
                    <div className="mb-2 border-b border-border/60 pb-2 flex justify-between text-[11px] text-muted-foreground">
                      <span>To: <strong>Waiting Parents (3 families)</strong></span>
                      <span>10:02 AM</span>
                    </div>
                    <p className="text-xs font-bold text-foreground">📅 Lesson slot reopened: Friday 10am</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      Hi there! A tutoring slot has just become available with Maya Chen on Friday 5th June at 10:00 AM. Click the button below to book it:
                    </p>
                    <button className="mt-3 block w-full rounded-xl bg-blue-500 py-2 text-center text-xs font-bold text-white shadow-md hover:bg-blue-600 transition">
                      Claim Friday 10:00 AM Slot
                    </button>
                  </div>

                  <div className="border-t border-border/50 pt-4 text-[10px] text-muted-foreground text-center">
                    ⚡ Filled instantly! Reopens availability on your public calendar automatically.
                  </div>
                </div>
              )}

              {activeTab === "shelf" && (
                <div className="flex flex-col h-full justify-between animate-in fade-in duration-300">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                      <FileText className="size-3.5" />
                      Resource Storefront Shelf
                    </div>
                    <h4 className="font-heading text-base font-bold text-foreground">Digital Worksheet Library</h4>
                    <p className="text-xs text-muted-foreground">Parents can view and enquire about your study materials</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-2">
                    <div className="rounded-2xl border border-border/80 bg-background/50 p-3 flex flex-col justify-between hover:border-primary/20 transition">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground leading-tight">Algebra Basics Guide</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">25-Page GCSE PDF</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-black text-primary">£4.99</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Details</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-background/50 p-3 flex flex-col justify-between hover:border-primary/20 transition">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2">
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground leading-tight">Physics Equations</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Formulas cheatsheet</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-black text-primary">£2.50</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Details</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4 text-[10px] text-muted-foreground text-center">
                    📖 List worksheets alongside booking options on a single page.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA links below features */}
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

