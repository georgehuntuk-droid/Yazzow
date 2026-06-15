"use client";

import { useState, useEffect } from "react";
import { Lock, ShieldCheck, CreditCard, Loader2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import type { OpenSlot, TutorProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

type LessonCheckoutButtonProps = {
  tutor: TutorProfile;
  slot: OpenSlot;
  isDemo?: boolean;
  paymentsEnabled?: boolean;
};

export function LessonCheckoutButton({
  tutor,
  slot,
  isDemo = false,
  paymentsEnabled = true,
}: LessonCheckoutButtonProps) {
  const [email, setEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creditChecking, setCreditChecking] = useState(false);
  const [availableCredits, setAvailableCredits] = useState<number | null>(null);
  const [bookingWithCredit, setBookingWithCredit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditSuccess, setBookingCreditSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");

  useEffect(() => {
    if (!paymentsEnabled) {
      setPaymentMethod("cash");
    } else {
      setPaymentMethod("card");
    }
  }, [paymentsEnabled]);

  // Check credits on blur or debounce of parent email
  async function handleCheckCredits(emailVal: string) {
    if (!emailVal || !emailVal.includes("@") || isDemo) {
      setAvailableCredits(null);
      return;
    }

    setCreditChecking(true);
    try {
      const response = await fetch(
        `/api/tutor/credits?email=${encodeURIComponent(emailVal.trim())}&tutorId=${tutor.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableCredits(data.credits ?? 0);
      }
    } catch {
      setAvailableCredits(null);
    } finally {
      setCreditChecking(false);
    }
  }

  async function handleBookWithCredit() {
    setBookingWithCredit(true);
    setError(null);
    try {
      const response = await fetch("/api/tutor/book-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          tutorId: tutor.id,
          parentEmail: email,
          studentName: studentName || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to book with credit.");
        return;
      }

      setBookingCreditSuccess(true);
      setTimeout(() => {
        window.location.href = `/tutor/${tutor.username}?booked=1&booking_id=${data.bookingId}`;
      }, 1500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBookingWithCredit(false);
    }
  }

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      if (paymentMethod === "cash") {
        // Direct cash booking
        const response = await fetch("/api/tutor/book-direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slotId: slot.id,
            tutorId: tutor.id,
            parentEmail: email,
            studentName: studentName || undefined,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Failed to confirm direct booking.");
          return;
        }

        setBookingCreditSuccess(true);
        setTimeout(() => {
          window.location.href = `/tutor/${tutor.username}?booked=1&booking_id=${data.bookingId}`;
        }, 1500);
      } else {
        // Card checkout (Stripe)
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
      }
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
            onChange={(e) => {
              setEmail(e.target.value);
              if (!e.target.value.includes("@")) {
                setAvailableCredits(null);
              }
            }}
            onBlur={(e) => handleCheckCredits(e.target.value)}
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

      {/* Payment Method Selector (only if not booking with credits) */}
      {availableCredits === null || availableCredits === 0 ? (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Payment Method
          </span>
          {paymentsEnabled ? (
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={cn(
                  "py-2 text-xs font-bold rounded-lg transition-all",
                  paymentMethod === "card"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <CreditCard className="size-3.5" />
                  Pay by Card
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "py-2 text-xs font-bold rounded-lg transition-all",
                  paymentMethod === "cash"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center justify-center gap-1.5">
                  💵
                  Pay Directly (Cash)
                </span>
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 text-xs text-amber-800 leading-normal font-medium">
              ⚠️ Online card checkout is currently unavailable for this tutor.
              <strong> You will pay the tutor directly (Cash/Direct) for this lesson.</strong>
            </div>
          )}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
          {error}
        </div>
      ) : null}

      {creditSuccess ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-700 font-semibold text-center">
          {paymentMethod === "cash"
            ? "Lesson booked successfully! Pay your tutor directly."
            : "Lesson booked successfully using credit!"}
        </div>
      ) : availableCredits !== null && availableCredits > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg font-medium flex items-center justify-between">
            <span>You have {availableCredits} prepaid credit{availableCredits === 1 ? "" : "s"} left.</span>
            <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-800">Available</span>
          </p>
          <Button
            type="button"
            className="w-full h-11 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-center gap-1.5"
            disabled={bookingWithCredit}
            onClick={handleBookWithCredit}
          >
            {bookingWithCredit ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Booking with Credit…
              </>
            ) : (
              <>
                Book using 1 Credit
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <div className="text-center">
            <button
              type="button"
              disabled={loading}
              onClick={handleCheckout}
              className="text-[11px] text-muted-foreground underline hover:text-foreground font-semibold"
            >
              Or pay standard {formatMoney(tutor.lessonPriceCents, tutor.currency)} instead
            </button>
          </div>
        </div>
      ) : (
        <Button
          className="w-full h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
          disabled={loading || !email || creditChecking}
          onClick={handleCheckout}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {paymentMethod === "cash" ? "Confirming Booking…" : "Redirecting to Stripe…"}
            </span>
          ) : creditChecking ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Checking credits…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              {paymentMethod === "cash" ? (
                <>
                  Confirm Booking (Cash/Direct)
                </>
              ) : (
                <>
                  Book & Pay {formatMoney(tutor.lessonPriceCents, tutor.currency)}
                </>
              )}
              <ArrowRight className="size-4" />
            </span>
          )}
        </Button>
      )}

      {/* Trust & Security Badge */}
      {paymentMethod === "card" ? (
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
      ) : (
        <div className="rounded-xl bg-muted/60 border border-border/40 p-3 flex items-start gap-3">
          <span className="text-base shrink-0 mt-0.5">💵</span>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
              Direct/Cash Booking
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This slot is reserved instantly on the calendar. You will pay your tutor directly via cash, bank transfer, or their preferred method.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
