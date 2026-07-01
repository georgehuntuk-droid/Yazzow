"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Sparkles, Download, CreditCard, X, Loader2, ShieldCheck, Lock, AlertCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { detectUserCurrency, convertAmount, subscribeToCurrencyChange } from "@/lib/currency";
import type { DigitalResource } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type ResourceShelfProps = {
  resources: DigitalResource[];
  tutorUsername?: string; // Passed only on the public profile storefront page
  paymentsEnabled?: boolean;
};

export function ResourceShelf({ resources, tutorUsername, paymentsEnabled = true }: ResourceShelfProps) {
  const router = useRouter();
  const firstResCurrency = resources[0]?.currency || "gbp";
  const [currency, setCurrency] = useState(firstResCurrency);
  const [selectedResource, setSelectedResource] = useState<DigitalResource | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrency(detectUserCurrency(firstResCurrency));
    return subscribeToCurrencyChange((newCurr) => setCurrency(newCurr));
  }, [firstResCurrency]);

  // Pre-fill email if user is logged in
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
      } catch {
        // ignore session errors
      }
    }
    void loadUser();
  }, []);

  const getDisplayPrice = (cents: number, fromCurrency: string) => {
    const { amountCents } = convertAmount(cents, fromCurrency, currency);
    return formatMoney(amountCents, currency);
  };

  async function handleCheckout(resourceId: string) {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout/resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          tutorUsername,
          buyerEmail: email,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout session.");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setLoading(false);
    }
  }

  if (resources.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
        No worksheet packs listed yet.
      </p>
    );
  }

  const isPublicView = !!tutorUsername;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {resources.map((resource) => (
        <Card
          key={resource.id}
          className="yazz-surface flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.04),0_0_15px_oklch(from_var(--primary)_l_c_h_/_0.06)] hover:border-primary/30 transition-all duration-300 group overflow-hidden"
        >
          {/* Preview Box with Grid & Glow */}
          <div className="mx-6 mt-6 flex h-32 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 via-secondary/40 to-primary/5 border border-primary/10 relative overflow-hidden group-hover:scale-[1.01] transition-transform duration-300">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,var(--primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--primary)_1px,transparent_1px)] bg-[size:16px_16px]" />
            
            {/* Glowing Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-primary/10 text-primary shadow-[0_4px_12px_rgba(0,0,0,0.02)] group-hover:scale-110 group-hover:shadow-[0_0_12px_var(--primary)] transition-all duration-300 relative z-10">
              <FileText className="size-6" />
            </div>
            
            <span className="font-heading text-xs font-bold text-muted-foreground/80 mt-2.5 uppercase tracking-wider relative z-10">
              Worksheet Pack
            </span>
          </div>

          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
              {resource.title}
              {resource.priceCents === 0 && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] py-0 px-1.5 font-bold">
                  Free
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
              {resource.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1" />
          
          <CardFooter className="flex flex-col gap-3.5 border-t border-border/40 pt-4 px-6 pb-6">
            <div className="w-full flex items-center justify-between">
              <span className="text-xl font-black text-primary font-heading tracking-tight">
                {resource.priceCents === 0 ? "Free" : getDisplayPrice(resource.priceCents, resource.currency)}
              </span>
              {resource.priceCents > 0 && (
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded">
                  Paid Resource
                </span>
              )}
            </div>

            {/* Action buttons based on Public/Private context */}
            {isPublicView ? (
              // PUBLIC profile view
              resource.priceCents === 0 ? (
                // Free download on public profile
                <a
                  href={`/api/resource/download?resourceId=${resource.id}`}
                  className="w-full inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
                >
                  <Download className="size-4" /> Download Free Pack
                </a>
              ) : (
                // Paid checkout on public profile
                <Button
                  onClick={() => { setSelectedResource(resource); setError(null); }}
                  className="w-full h-10 text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                  disabled={!paymentsEnabled}
                >
                  <CreditCard className="size-4" /> 
                  {!paymentsEnabled ? "Storefront Offline" : `Buy Pack`}
                </Button>
              )
            ) : (
              // PRIVATE workspace view (Pupil already connected gets to download directly!)
              <a
                href={`/api/resource/download?resourceId=${resource.id}&workspace=true`}
                className="w-full inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
              >
                <Download className="size-4" /> Download Pack
              </a>
            )}
          </CardFooter>
        </Card>
      ))}

      {/* Checkout Modal Dialog */}
      {selectedResource && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg size-8 cursor-pointer"
              onClick={() => setSelectedResource(null)}
            >
              <X className="size-4" />
            </Button>

            <div className="p-6 space-y-5">
              <div className="space-y-1.5 pr-6">
                <span className="text-[10px] font-black text-primary uppercase tracking-wider block">Checkout</span>
                <h3 className="font-heading text-lg font-black text-foreground">
                  Purchase Worksheet Pack
                </h3>
              </div>

              {/* Resource summary info */}
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-1">
                <p className="font-bold text-sm text-foreground">{selectedResource.title}</p>
                <p className="text-xs text-muted-foreground leading-normal">{selectedResource.description}</p>
                <div className="pt-2 flex items-center justify-between border-t border-border/20 mt-2">
                  <span className="text-xs font-semibold text-muted-foreground">Price</span>
                  <span className="font-black text-primary text-sm">
                    {getDisplayPrice(selectedResource.priceCents, selectedResource.currency)}
                  </span>
                </div>
              </div>

              {/* Email entry */}
              <div className="space-y-1.5">
                <label htmlFor="buyer-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Deliver to Email Address
                </label>
                <Input
                  id="buyer-email"
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl"
                  disabled={loading}
                />
                <span className="text-[10px] text-muted-foreground leading-normal block">
                  We will email your secure download link to this address immediately after checkout.
                </span>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive font-medium flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Trust Badge */}
              <div className="rounded-2xl bg-muted/50 border border-border/40 p-3 flex items-start gap-3">
                <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Secure checkout via Stripe
                    <Lock className="size-3 text-muted-foreground" />
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Your payment details are fully encrypted and securely processed by Stripe.
                  </p>
                </div>
              </div>

              {/* Action button */}
              <Button
                className="w-full h-11 text-xs font-bold rounded-2xl shadow-md cursor-pointer"
                disabled={loading || !email}
                onClick={() => handleCheckout(selectedResource.id)}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="size-4 animate-spin" />
                    Redirecting to payment…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <CreditCard className="size-4" />
                    Proceed to Card Payment
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
