"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import type { OpenSlot, TutorProfile } from "@/lib/types";

type LessonCheckoutButtonProps = {
  tutor: TutorProfile;
  slot: OpenSlot;
};

export function LessonCheckoutButton({ tutor, slot }: LessonCheckoutButtonProps) {
  const [email, setEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          tutorUsername: tutor.username,
          parentEmail: email,
          studentName: studentName || undefined,
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
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="parent-email" className="text-sm font-medium">
          Parent email
        </label>
        <Input
          id="parent-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@family.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="student-name" className="text-sm font-medium">
          Student name (optional)
        </label>
        <Input
          id="student-name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Amelia"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        className="w-full"
        disabled={loading || !email}
        onClick={handleCheckout}
      >
        {loading
          ? "Redirecting to Stripe…"
          : `Pay ${formatMoney(tutor.lessonPriceCents, tutor.currency)} · secure checkout`}
      </Button>
      <p className="text-xs text-muted-foreground">
        Full price charged now. Yazzow takes a small platform fee; the rest goes
        to your tutor via Stripe.
      </p>
    </div>
  );
}
