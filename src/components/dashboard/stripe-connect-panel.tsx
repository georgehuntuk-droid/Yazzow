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

type StripeConnectPanelProps = {
  configured: boolean;
  status: ConnectStatus | null;
  configHelpText: string;
};

export function StripeConnectPanel({
  configured,
  status,
  configHelpText,
}: StripeConnectPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/connect", { method: "POST" });
      
      let data: { url?: string; error?: string } = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }
      
      if (!response.ok) {
        setError(data.error ?? `Error ${response.status}: Could not start Stripe setup.`);
        return;
      }
      
      if (!data.url) {
        setError("Invalid response from server: missing redirect URL.");
        return;
      }
      
      window.location.href = data.url;
    } catch (err) {
      setError(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="font-heading">Payments not configured</CardTitle>
          <CardDescription>{configHelpText}</CardDescription>
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
              Connect once so <strong>lesson</strong> bookings paid on your portal go to your bank.
              Worksheet packs on your shelf are listed only — parents pay you directly.
            </CardDescription>
          </div>
          <Badge variant={ready ? "default" : "secondary"}>
            {ready ? "Connected" : "Setup needed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Parents pay your lesson price upfront when they book on your portal.</li>
          <li>Payments land in your Stripe balance; Stripe pays out on their schedule.</li>
          <li>Learning packs are not sold through Yazzow — no Connect setup needed for those.</li>
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
