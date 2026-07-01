"use client";

import { useState, useEffect } from "react";
import { Lock, ShieldCheck, CreditCard, Loader2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, formatSlotRange } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { OpenSlot, TutorProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { detectUserCurrency, convertAmount, subscribeToCurrencyChange } from "@/lib/currency";

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
  const [currency, setCurrency] = useState(tutor.currency);
  useEffect(() => {
    setCurrency(detectUserCurrency(tutor.currency));
    return subscribeToCurrencyChange((newCurr) => setCurrency(newCurr));
  }, [tutor.currency]);

  const getDisplayPrice = (cents: number, fromCurrency: string = tutor.currency) => {
    const { amountCents } = convertAmount(cents, fromCurrency, currency);
    return formatMoney(amountCents, currency);
  };
  const [email, setEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creditChecking, setCreditChecking] = useState(false);
  const [availableCredits, setAvailableCredits] = useState<number | null>(null);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [bookingWithCredit, setBookingWithCredit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditSuccess, setBookingCreditSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "account">("card");

  const slotDurationMs = new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime();
  const durationHours = slotDurationMs / (60 * 60 * 1000);
  const lessonPriceCents = Math.max(50, Math.round(tutor.lessonPriceCents * durationHours));

  const tutorAllowsCash = tutor.allowCashPayments !== false;
  const bookingUnavailable = !paymentsEnabled && !tutorAllowsCash;

  useEffect(() => {
    if (!paymentsEnabled) {
      setPaymentMethod("cash");
    } else if (!tutorAllowsCash) {
      setPaymentMethod("card");
    } else {
      setPaymentMethod("card");
    }
  }, [paymentsEnabled, tutorAllowsCash]);

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
        setCreditLimit(data.creditLimit ?? 0);
        if (data.studentName) {
          setStudentName(data.studentName);
        }
      }
    } catch {
      setAvailableCredits(null);
      setCreditLimit(0);
    } finally {
      setCreditChecking(false);
    }
  }

  useEffect(() => {
    async function checkSession() {
      if (isDemo) return;
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
          setIsLoggedIn(true);
          // Trigger credits check right away
          void handleCheckCredits(session.user.email);
        }
      } catch {
        // ignore session load errors
      }
    }
    void checkSession();
  }, [isDemo]);

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

  const canBookOnAccount =
    availableCredits !== null &&
    creditLimit > 0 &&
    availableCredits > -creditLimit;

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      if (paymentMethod === "account") {
        await handleBookWithCredit();
        return;
      }

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
      {/* Selected Lesson Summary Card */}
      <div className="rounded-xl border border-border bg-card/60 p-4 flex flex-col gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Selected Lesson</p>
            <p className="text-sm font-extrabold text-foreground">
              {formatSlotRange(slot.startsAt, slot.endsAt)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {Math.abs(durationHours - 1) < 0.01 ? "Lesson Price" : "Lesson Price (Prorated)"}
            </p>
            <p className="text-sm font-black text-primary mt-0.5">
              {getDisplayPrice(lessonPriceCents)}
            </p>
          </div>
        </div>
      </div>

      {isLoggedIn ? (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              Booking Account
            </span>
            <span className="text-sm font-bold text-foreground">{email}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200/60 shadow-sm">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Signed In
          </span>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="parent-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Email Address
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
              placeholder="you@example.com"
              className="h-10 bg-background"
            />
          </div>
        </div>
      )}

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
      {availableCredits === null || availableCredits <= 0 ? (
        <div className="space-y-2.5">
          {bookingUnavailable ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive leading-normal font-medium">
              ⚠️ Online booking is currently unavailable for this tutor. Direct bookings are disabled and card checkout is not set up. Please contact the tutor directly.
            </div>
          ) : (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Payment Method
              </span>
              <div className={cn(
                "grid gap-2 p-1 bg-muted rounded-xl border border-border/60",
                canBookOnAccount && tutorAllowsCash ? "grid-cols-3" : (canBookOnAccount || tutorAllowsCash) ? "grid-cols-2" : "grid-cols-1"
              )}>
                {paymentsEnabled && (
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
                )}
                {tutorAllowsCash && (
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
                      Bank/Cash
                    </span>
                  </button>
                )}
                {canBookOnAccount && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("account")}
                    className={cn(
                      "py-2 text-xs font-bold rounded-lg transition-all",
                      paymentMethod === "account"
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      📝
                      On Account
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Tutor Payment Instructions Box */}
          {paymentMethod === "cash" && tutor.paymentInstructions && !bookingUnavailable ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground space-y-1">
              <p className="font-bold text-primary flex items-center gap-1">📣 Tutor Payment Instructions:</p>
              <p className="whitespace-pre-line text-muted-foreground leading-normal font-medium">{tutor.paymentInstructions}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
          {error}
        </div>
      ) : null}

      {availableCredits !== null && creditLimit > 0 && availableCredits <= -creditLimit ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive leading-normal font-medium mb-1">
          ⚠️ Booking blocked: you have exceeded your credit limit. Please contact your tutor to clear your balance and resume bookings.
        </div>
      ) : null}

      {creditSuccess ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-700 font-semibold text-center">
          {paymentMethod === "cash"
            ? "Lesson booked successfully! Pay your tutor directly."
            : paymentMethod === "account"
            ? "Lesson booked successfully on account!"
            : "Lesson booked successfully!"}
        </div>
      ) : availableCredits !== null && creditLimit > 0 && availableCredits <= -creditLimit && paymentMethod === "account" ? (
        <Button
          className="w-full h-11 text-sm font-semibold shadow-md cursor-not-allowed opacity-55"
          disabled
        >
          Booking Blocked (Limit Exceeded)
        </Button>
      ) : availableCredits !== null && availableCredits > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg font-medium flex items-center justify-between">
            <span>
              You have {availableCredits} prepaid credit{availableCredits === 1 ? "" : "s"} left.
            </span>
            <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-800">
              Available
            </span>
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
                Book using Credit
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {paymentMethod === "account" && availableCredits !== null && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg font-medium flex items-center justify-between">
              <span>
                You will book on account (balance: {Math.abs(availableCredits)} unpaid lesson{Math.abs(availableCredits) === 1 ? "" : "s"}{creditLimit > 0 ? `, limit: ${creditLimit}` : ""}).
              </span>
              <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-800">
                On Account
              </span>
            </p>
          )}
          <Button
            className="w-full h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            disabled={loading || !email || creditChecking || bookingUnavailable}
            onClick={handleCheckout}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {paymentMethod === "cash" ? "Confirming Booking…" : paymentMethod === "account" ? "Booking on Account…" : "Redirecting to Stripe…"}
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
                    Confirm Booking (Bank/Cash)
                  </>
                ) : paymentMethod === "account" ? (
                  <>
                    Book on Account
                  </>
                ) : (
                  <>
                    Book & Pay {getDisplayPrice(lessonPriceCents)}
                  </>
                )}
                <ArrowRight className="size-4" />
              </span>
            )}
          </Button>
        </div>
      )}
      {paymentMethod === "card" && currency.toLowerCase() !== tutor.currency.toLowerCase() && (
        <p className="text-[10px] text-muted-foreground text-center mt-1.5 leading-normal animate-in fade-in">
          Billed in {tutor.currency.toUpperCase()} at checkout ({formatMoney(lessonPriceCents, tutor.currency)}).
        </p>
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
              This slot is reserved instantly on the calendar. You will pay your tutor directly via bank transfer, cash, or their preferred method.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
