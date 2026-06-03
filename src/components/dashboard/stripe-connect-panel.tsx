"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ConnectStatus } from "@/lib/stripe/connect";
import { PLATFORM_FEES } from "@/lib/constants";

type StripeConnectPanelProps = {
  configured: boolean;
  status: ConnectStatus | null;
};

export function StripeConnectPanel({ configured, status }: StripeConnectPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/connect", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Could not start Stripe setup.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="font-heading">Payments not configured</CardTitle>
          <CardDescription>
            Add <code className="text-xs">STRIPE_SECRET_KEY</code> and{" "}
            <code className="text-xs">STRIPE_WEBHOOK_SECRET</code> to{" "}
            <code className="text-xs">.env.local</code>, then restart the dev server.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const ready = status?.ready ?? false;

  return (
    <Card className="yazz-surface">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-heading">Stripe payouts</CardTitle>
            <CardDescription className="mt-1">
              Connect once so lesson and worksheet payments go to your bank. Lessons have no
              per-booking Yazzow fee; digital packs include {PLATFORM_FEES.digitalGoodsPercent}%
              at checkout.
            </CardDescription>
          </div>
          <Badge variant={ready ? "default" : "secondary"}>
            {ready ? "Connected" : "Setup needed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Parents pay full price upfront at booking or purchase.</li>
          <li>Your share lands in your Stripe balance; Stripe pays out on their schedule.</li>
          <li>Worksheet sales: Yazzow&apos;s {PLATFORM_FEES.digitalGoodsPercent}% fee is deducted automatically.</li>
        </ul>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button onClick={handleConnect} disabled={loading}>
          {loading
            ? "Opening Stripe…"
            : ready
              ? "Open Stripe dashboard"
              : "Connect Stripe payouts"}
        </Button>
      </CardContent>
    </Card>
  );
}
