"use client";

import { useState } from "react";
import { Sparkles, Loader2, ArrowRight, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TutorProfile, TutorPackage } from "@/lib/types";

type LessonPackagesTabProps = {
  tutor: TutorProfile;
  packages?: TutorPackage[];
  paymentsEnabled?: boolean;
  paymentsBlockedMessage?: string;
  isDemo?: boolean;
};

export function LessonPackagesTab({
  tutor,
  packages = [],
  paymentsEnabled = true,
  paymentsBlockedMessage,
  isDemo = false,
}: LessonPackagesTabProps) {
  const [email, setEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCustomPackages = packages && packages.length > 0;
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(() => {
    return hasCustomPackages ? packages[0].id : null;
  });

  const selectedPackage = hasCustomPackages
    ? packages.find((p) => p.id === selectedPackageId)
    : null;

  // Compute package pricing
  const lessonsCount = selectedPackage ? selectedPackage.lessonsCount : (tutor.blockPackageLessonsCount ?? 10);
  const discountPercent = tutor.blockPackageDiscountPercent ?? 10;
  const discountMultiplier = 1 - discountPercent / 100;

  const packagePriceCents = selectedPackage
    ? selectedPackage.priceCents
    : Math.round(tutor.lessonPriceCents * lessonsCount * discountMultiplier);

  const totalStandardCents = tutor.lessonPriceCents * lessonsCount;
  const totalSavingsCents = totalStandardCents - packagePriceCents;

  async function handlePackageCheckout() {
    if (isDemo) {
      setError("This is a sample portal. Create your own account to accept real booking packages.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout/package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorUsername: tutor.username,
          parentEmail: email,
          studentName: studentName || undefined,
          packageId: selectedPackageId || undefined,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Checkout unavailable.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="yazz-surface overflow-hidden border-primary/20 shadow-lg shadow-blue-500/5">
        <div className="bg-primary/5 px-6 py-3 border-b border-primary/10 flex items-center gap-2">
          <Sparkles className="size-4.5 text-primary animate-pulse" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            {hasCustomPackages ? "Tutor Lesson Bundles" : "Upfront Value block package"}
          </span>
        </div>

        <CardHeader className="space-y-2">
          <CardTitle className="font-heading text-2xl font-bold text-foreground">
            {selectedPackage ? selectedPackage.name : `${lessonsCount}x Lesson Credits Package`}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground leading-relaxed">
            Secure your child&apos;s ongoing tutoring by purchasing lesson credits in bulk upfront. 
            Once purchased, easily log in with your email on the booking calendar to instantly select dates and book sessions without having to pay per-checkout!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Custom Packages Grid Selector */}
          {hasCustomPackages && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                1. Select a Lesson Bundle
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                {packages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  const perLessonRateCents = Math.round(pkg.priceCents / pkg.lessonsCount);
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={cn(
                        "text-left p-4.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative cursor-pointer",
                        isSelected
                          ? "bg-primary/5 border-primary shadow-sm ring-2 ring-primary/60"
                          : "bg-background border-border hover:border-muted-foreground/30 hover:bg-muted/10"
                      )}
                    >
                      {isSelected && (
                        <span className="absolute top-3 right-3 text-emerald-600 font-bold text-xs flex items-center gap-0.5">
                          <CheckCircle2 className="size-4 fill-emerald-50 text-emerald-600" />
                          Selected
                        </span>
                      )}
                      <div>
                        <p className="font-heading font-black text-foreground text-sm tracking-tight pr-16">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{pkg.lessonsCount} lessons bundle</p>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-black text-foreground">{formatMoney(pkg.priceCents, pkg.currency)}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground">({formatMoney(perLessonRateCents, pkg.currency)}/lesson)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Package Pricing Summary */}
          {(!hasCustomPackages || selectedPackage) && (
            <div className="space-y-2.5">
              {hasCustomPackages && (
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  2. Pricing Summary
                </span>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 border border-border/60 rounded-2xl p-5">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Standard Rate</span>
                  <p className="text-base font-medium line-through text-muted-foreground/80">
                    {formatMoney(totalStandardCents, tutor.currency)}
                  </p>
                </div>
                <div className="space-y-0.5 text-center border-y sm:border-y-0 sm:border-x border-border/60 py-2 sm:py-0 sm:px-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-green-600 font-bold">You Save</span>
                  <p className="text-lg font-bold text-green-600">
                    {discountPercent}% ({formatMoney(totalSavingsCents, tutor.currency)})
                  </p>
                </div>
                <div className="space-y-0.5 text-center sm:text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary font-bold">Package Price</span>
                  <p className="text-2xl font-black text-primary">
                    {formatMoney(packagePriceCents, tutor.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
              How bulk credits work:
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground list-none pl-0">
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>You are purchasing exactly <strong className="text-foreground">{lessonsCount} hour credits</strong> to use on this portal.</span>
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>No recurring subscriptions or commitments — buy credits only when you need them.</span>
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>Credits are stored under your parent email address securely.</span>
              </li>
            </ul>
          </div>

          {/* Checkout Input Controls */}
          <div className="border-t border-border/60 pt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="package-parent-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Parent Email Address
                </label>
                <Input
                  id="package-parent-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@family.com"
                  className="h-10 bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="package-student-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Student Name (optional)
                </label>
                <Input
                  id="package-student-name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Amelia"
                  className="h-10 bg-background"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
                {error}
              </div>
            ) : null}

            {!paymentsEnabled ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive font-medium">
                {paymentsBlockedMessage || "Online block booking is not active right now."}
              </div>
            ) : (
              <Button
                className="w-full h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                disabled={loading || !email}
                onClick={handlePackageCheckout}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Redirecting to Stripe…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    Purchase Bundle for {formatMoney(packagePriceCents, tutor.currency)}
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            )}
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 border-t border-border/60 p-4 flex items-start gap-3">
          <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
              Guaranteed secure checkout via Stripe
              <Lock className="size-3 text-muted-foreground" />
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Payments are fully encrypted, split securely, and deposited directly into your tutor&apos;s linked payout account.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
