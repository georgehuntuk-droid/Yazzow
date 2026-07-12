"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, CreditCard, Sparkles, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";
import type { TutorSubscriptionState } from "@/lib/stripe/subscription";

type SubscriptionBillingPanelProps = {
  configured: boolean;
  subscription: TutorSubscriptionState;
  isAdmin?: boolean;
  isSuccess?: boolean;
  isCancelled?: boolean;
};

export function SubscriptionBillingPanel({
  configured,
  subscription,
  isAdmin = false,
  isSuccess = false,
  isCancelled = false,
}: SubscriptionBillingPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribed = subscription.active;
  const isDev = typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const showDevHints = isAdmin || isDev;

  // Auto-refresh logic if redirected from Stripe checkout but webhook hasn't updated the DB yet
  useEffect(() => {
    if (isSuccess && !subscribed) {
      const timer = setTimeout(() => {
        router.refresh();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, subscribed, router]);

  async function openCheckout(tier: "independent" | "academy" | "starter" | "growth" | "agency") {
    setLoading(true);
    setLoadingTier(tier);
    setError(null);
    try {
      const response = await fetch("/api/stripe/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
      setLoadingTier(null);
    }
  }

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/subscription/portal", {
        method: "POST",
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Could not open billing portal.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
    const isComp = !subscription.stripeCustomerId;
    const confirmMsg = isComp
      ? "Are you sure you want to cancel your complimentary Yazzow membership? This will immediately revert your portal to the inactive status."
      : "Are you sure you want to cancel your Yazzow subscription? Your portal will remain active until the end of your paid billing cycle, and no further payments will be taken.";

    if (!confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/subscription/cancel", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to cancel subscription.");
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Could not cancel subscription. Please contact support.");
    } finally {
      setLoading(false);
    }
  }

  const renewsLabel =
    subscribed &&
    subscription.currentPeriodEnd &&
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(subscription.currentPeriodEnd));

  const blocked =
    !configured || subscription.subscriptionTrackingUnavailable;

  const rawTier = subscription.subscriptionTier || "independent";
  const currentTier: keyof typeof SUBSCRIPTION_TIERS =
    rawTier === "agency"
      ? "academy"
      : (rawTier === "growth" || rawTier === "starter")
      ? "independent"
      : (rawTier as any);
  const isFreeTrial = subscription.status === "trialing" && !subscription.stripeCustomerId;

  return (
    <Card id="subscription" className="yazz-surface border-primary/20 scroll-mt-8 overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <CreditCard className="size-5 text-primary" />
          Subscription Plans & Billing
        </CardTitle>
        <CardDescription>
          Unlock all core features (slot alerts, automated reminders, and private portals) with tiers sized exactly for your business.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success / Pending / Cancelled Banners */}
        {isSuccess && subscribed && (
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-start gap-3">
            <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary">Subscription activated successfully!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Thank you for subscribing. Your plan is now fully active.</p>
            </div>
          </div>
        )}

        {isSuccess && !subscribed && (
          <div className="rounded-xl bg-muted/80 border border-border p-4 flex items-start gap-3 animate-pulse">
            <Loader2 className="size-5 text-primary shrink-0 mt-0.5 animate-spin" />
            <div>
              <p className="text-sm font-semibold text-foreground">Finalizing your subscription…</p>
              <p className="text-xs text-muted-foreground mt-0.5">We are secure-syncing your billing details with Stripe. This page will refresh automatically in a few seconds.</p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Checkout cancelled</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your checkout session was cancelled. No charges were made. You can try again whenever you are ready.</p>
            </div>
          </div>
        )}

        {/* Trial Expired Alert Banner */}
        {subscription.status === "trialing" && !subscription.active && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
            <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">Your free trial has expired</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your 7-day free trial is over and online bookings have been temporarily paused. Please choose one of the plans below to reactivate your portal.
              </p>
            </div>
          </div>
        )}

        {subscribed && (
          <div className="space-y-2 pb-2">
            <div className="flex items-center gap-2">
              {subscription.cancelAtPeriodEnd ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  Cancelling (Active until {renewsLabel})
                </span>
              ) : isFreeTrial ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200/30">
                  <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Free Trial ({SUBSCRIPTION_TIERS[currentTier]?.name} Plan)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <span className="size-1.5 rounded-full bg-primary animate-ping" />
                  Active {SUBSCRIPTION_TIERS[currentTier]?.name} Plan
                </span>
              )}
              {!subscription.stripeCustomerId && !isFreeTrial && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Complimentary Access
                </span>
              )}
            </div>
            {isFreeTrial ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your 7-day free trial is currently active. You have{" "}
                <strong className="text-foreground font-bold">
                  {(() => {
                    if (!subscription.currentPeriodEnd) return 7;
                    const diffTime = new Date(subscription.currentPeriodEnd).getTime() - Date.now();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays > 0 ? diffDays : 0;
                  })()}
                </strong>{" "}
                days remaining to set up your portal and invite students. Choose a plan below to subscribe.
              </p>
            ) : renewsLabel && !subscription.cancelAtPeriodEnd ? (
              <p className="text-sm text-muted-foreground">
                Current plan: <strong>{SUBSCRIPTION_TIERS[currentTier]?.name}</strong>. Next billing date is <span className="text-foreground font-semibold">{renewsLabel}</span>.
              </p>
            ) : !subscription.stripeCustomerId ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your account is currently upgraded with complimentary premium access by the platform admin. You have unlimited access to all features!
              </p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {subscription.stripeCustomerId && subscription.cancelAtPeriodEnd && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3 mt-2">
                <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Cancellation scheduled</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your subscription will remain active until the end of your current cycle on <strong>{renewsLabel}</strong>. No further payments will be taken.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl gap-6 pt-2">
          {(Object.keys(SUBSCRIPTION_TIERS) as Array<keyof typeof SUBSCRIPTION_TIERS>).map((tierKey) => {
            const tier = SUBSCRIPTION_TIERS[tierKey];
            const isCurrent = subscribed && currentTier === tierKey;
            const isPopular = tierKey === "academy";

            return (
              <div
                key={tierKey}
                className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? "border-primary bg-primary/5 shadow-md"
                    : isPopular
                    ? "border-primary/40 bg-muted/40 shadow-sm hover:border-primary/70"
                    : "border-border bg-muted/20 hover:border-border-hover"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 right-4 bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="size-3" />
                    Popular
                  </span>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                      <span>{tier.name}</span>
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        7-Day Trial
                      </span>
                    </h3>
                    {isCurrent && (
                      <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold font-heading">{tier.priceLabel}</span>
                  </div>
                  
                  <p className="text-xs font-semibold text-primary mb-3">
                    {tier.maxStudents ? `Up to ${tier.maxStudents} active students` : "Unlimited active students"}
                  </p>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {tier.description}
                  </p>
                </div>

                <div className="pt-4 mt-auto">
                  {subscribed && subscription.stripeCustomerId ? (
                    <Button
                      type="button"
                      variant={isCurrent ? "outline" : "secondary"}
                      disabled={isCurrent || loading}
                      onClick={openPortal}
                      className="w-full h-9 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      {isCurrent ? "Active Plan" : "Change via Portal"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant={isPopular ? "default" : "outline"}
                      disabled={(isCurrent && subscribed) || loading || blocked}
                      onClick={() => openCheckout(tierKey)}
                      className="w-full h-9 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      {loadingTier === tierKey ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="size-3 animate-spin" />
                          Opening…
                        </span>
                      ) : isCurrent && subscribed ? (
                        "Active Plan"
                      ) : (
                        `Choose ${tier.name}`
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {subscribed && !subscription.cancelAtPeriodEnd && (
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
            {subscription.stripeCustomerId && (
              <Button
                type="button"
                variant="outline"
                onClick={openPortal}
                disabled={loading}
                className="h-9 text-xs font-semibold border-border/80 hover:bg-muted text-foreground rounded-xl cursor-pointer"
              >
                {loading ? "Opening…" : "Manage billing & invoices"}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelSubscription}
              disabled={loading}
              className="h-9 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl cursor-pointer font-semibold"
            >
              {loading ? "Cancelling…" : "Cancel Membership"}
            </Button>
          </div>
        )}

        {/* Dev / Config Banners */}
        {subscription.subscriptionTrackingUnavailable && showDevHints && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/10 dark:text-amber-300">
            <p className="font-semibold mb-1">Developer Notice (Admin/Dev only):</p>
            <p>
              Subscription billing is not set up in the database yet. Run Supabase migration{" "}
              <code className="text-xs font-mono">004_tutor_subscription.sql</code>, then refresh.
            </p>
          </div>
        )}

        {!configured && showDevHints && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/10 dark:text-amber-300">
            <p className="font-semibold mb-1">Developer Notice (Admin/Dev only):</p>
            <p>
              Stripe is not configured on this site yet (<code className="text-xs font-mono">STRIPE_SECRET_KEY</code> missing). Ask the site owner to add it and redeploy.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
