"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TUTOR_SUBSCRIPTION } from "@/lib/constants";
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

  async function openCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/subscription/checkout", {
        method: "POST",
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
    if (
      !confirm(
        "Are you sure you want to cancel your Yazzow subscription? Your portal will remain active until the end of your paid billing cycle, and no further payments will be taken."
      )
    ) {
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

  return (
    <Card id="subscription" className="yazz-surface border-primary/20 scroll-mt-8 overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <CreditCard className="size-5 text-primary" />
          Your Yazzow plan
        </CardTitle>
        <CardDescription>
          {TUTOR_SUBSCRIPTION.label} — portal, schedule, and student tools. Paid securely through
          Stripe Checkout on Yazzow&apos;s billing (not a separate Stripe account for you).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success / Pending / Cancelled Banners */}
        {isSuccess && subscribed && (
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-start gap-3">
            <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary">Subscription activated successfully!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Thank you for subscribing. Your portal is now fully active.</p>
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

        {subscribed ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              {subscription.cancelAtPeriodEnd ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  Cancelling (Active until {renewsLabel})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <span className="size-1.5 rounded-full bg-primary animate-ping" />
                  Active Subscription
                </span>
              )}
              {!subscription.stripeCustomerId && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Complimentary Access
                </span>
              )}
            </div>
            {renewsLabel && !subscription.cancelAtPeriodEnd ? (
              <p className="text-sm text-muted-foreground">
                Next billing date is <span className="text-foreground font-semibold">{renewsLabel}</span>.
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

            {subscription.stripeCustomerId && !subscription.cancelAtPeriodEnd ? (
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button
                  variant="outline"
                  onClick={openPortal}
                  disabled={loading}
                  className="h-10 font-medium"
                >
                  {loading ? "Opening…" : "Manage billing & invoices"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="h-10 font-medium"
                >
                  {loading ? "Cancelling…" : "Cancel Subscription"}
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Subscribe to keep your portal fully active. You&apos;ll enter card details on Stripe&apos;s
              secure checkout page — same flow as any SaaS subscription.
            </p>

            {subscription.subscriptionTrackingUnavailable && (
              showDevHints ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/10 dark:text-amber-300">
                  <p className="font-semibold mb-1">Developer Notice (Admin/Dev only):</p>
                  <p>
                    Subscription billing is not set up in the database yet. Run Supabase migration{" "}
                    <code className="text-xs font-mono">004_tutor_subscription.sql</code>, then refresh.
                  </p>
                </div>
              ) : (
                <p className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-muted-foreground dark:bg-amber-950/20">
                  Billing services are currently undergoing maintenance. Please check back in a few minutes or contact support.
                </p>
              )
            )}

            {!configured && (
              showDevHints ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/10 dark:text-amber-300">
                  <p className="font-semibold mb-1">Developer Notice (Admin/Dev only):</p>
                  <p>
                    Stripe is not configured on this site yet (<code className="text-xs font-mono">STRIPE_SECRET_KEY</code> missing). Ask the site owner to add it and redeploy.
                  </p>
                </div>
              ) : (
                <p className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-muted-foreground dark:bg-amber-950/20">
                  Online checkout is temporarily unavailable. Please contact support to complete your subscription.
                </p>
              )
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button
              size="lg"
              className="w-full sm:w-auto h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={openCheckout}
              disabled={loading || blocked}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Opening Stripe…
                </span>
              ) : (
                `Subscribe now · ${TUTOR_SUBSCRIPTION.label}`
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
