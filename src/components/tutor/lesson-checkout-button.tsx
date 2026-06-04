"use client";

import { useState } from "react";
import { Lock, ShieldCheck, CreditCard, Loader2, ArrowRight } from "lucide-react";

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
    <div className="space-y-4 pt-1">
      <div className="space-y-1.5">
        <label htmlFor="parent-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Parent Email Address
        </label>
        <div className="relative">
          <Input
            id="parent-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@family.com"
            className="h-10 bg-background"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="student-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Student Name (optional)
        </label>
        <div className="relative">
          <Input
            id="student-name"
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

      <Button
        className="w-full h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
        disabled={loading || !email}
        onClick={handleCheckout}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Redirecting to Stripe…
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            Book & Pay {formatMoney(tutor.lessonPriceCents, tutor.currency)}
            <ArrowRight className="size-4" />
          </span>
        )}
      </Button>

      {/* Trust & Security Badge */}
      <div className="rounded-xl bg-muted/60 border border-border/40 p-3 flex items-start gap-3">
        <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            Secure checkout via Stripe
            <Lock className="size-3 text-muted-foreground" />
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your card details are fully encrypted and never stored on Yazzow. Billed securely to your tutor.
          </p>
        </div>
      </div>
    </div>
  );
}
