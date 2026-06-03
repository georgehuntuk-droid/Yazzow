"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLATFORM_FEES, TUTOR_SUBSCRIPTION } from "@/lib/constants";
import type { TutorSubscriptionState } from "@/lib/stripe/subscription";

type SubscriptionBillingPanelProps = {
  configured: boolean;
  subscription: TutorSubscriptionState;
};

export function SubscriptionBillingPanel({
  configured,
  subscription,
}: SubscriptionBillingPanelProps) {
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openCheckout() {
    setLoading("checkout");
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
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
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
      setLoading(null);
    }
  }

  if (!configured) {
    return null;
  }

  const active = subscription.active;
  const renewsLabel =
    subscription.currentPeriodEnd &&
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(subscription.currentPeriodEnd));

  return (
    <Card className="yazz-surface border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-heading">Yazzow subscription</CardTitle>
            <CardDescription className="mt-1">
              {TUTOR_SUBSCRIPTION.label} keeps your portal live. Lesson bookings have no
              per-sale fee — parents pay you in full (minus Stripe processing). Digital
              worksheet sales still include a {PLATFORM_FEES.digitalGoodsPercent}% platform
              fee.
            </CardDescription>
          </div>
          <Badge variant={active ? "default" : "secondary"}>
            {active ? "Active" : "Required"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Includes your private portal, schedule builder, and booking checkout.</li>
          <li>Billed monthly to your card via Stripe — cancel anytime from billing settings.</li>
          {active && renewsLabel ? (
            <li>
              Current period ends <span className="font-medium text-foreground">{renewsLabel}</span>
              .
            </li>
          ) : null}
        </ul>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          {active ? (
            <Button
              variant="outline"
              onClick={openPortal}
              disabled={loading !== null}
            >
              {loading === "portal" ? "Opening…" : "Manage billing"}
            </Button>
          ) : (
            <Button onClick={openCheckout} disabled={loading !== null}>
              {loading === "checkout"
                ? "Redirecting to Stripe…"
                : `Subscribe · ${TUTOR_SUBSCRIPTION.label}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
