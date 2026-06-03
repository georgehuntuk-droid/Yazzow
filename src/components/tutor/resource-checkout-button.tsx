"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DigitalResource } from "@/lib/types";

type ResourceCheckoutButtonProps = {
  resource: DigitalResource;
  tutorUsername: string;
};

export function ResourceCheckoutButton({
  resource,
  tutorUsername,
}: ResourceCheckoutButtonProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout/resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: resource.id,
          tutorUsername,
          buyerEmail: email,
        }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Checkout unavailable.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email for download link"
        className="text-sm"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button
        variant="secondary"
        className="w-full"
        disabled={loading || !email}
        onClick={handleCheckout}
      >
        {loading ? "Opening checkout…" : "Buy & download"}
      </Button>
    </div>
  );
}
