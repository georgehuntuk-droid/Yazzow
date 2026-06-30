"use client";

import { useState } from "react";
import { BookOpen, CreditCard, ChevronDown, ChevronUp, Sparkles, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StorefrontGuide() {
  const [isOpen, setIsOpen] = useState(true); // default open to make it immediately visible

  return (
    <Card className="yazz-surface border-primary/10 overflow-hidden shadow-sm transition-all duration-200">
      <CardHeader
        className="p-5 flex flex-row items-center justify-between gap-4 cursor-pointer select-none bg-muted/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
            <Sparkles className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
              Storefront & Stripe Guide
            </CardTitle>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Learn how digital sales work and why we use Stripe for secure direct payouts.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-8 rounded-lg shrink-0 text-muted-foreground hover:text-foreground">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </CardHeader>

      {isOpen && (
        <CardContent className="p-6 border-t border-border/40 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {/* Section 1: How it Works */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BookOpen className="size-4.5 text-primary" />
              How the Shop Manager Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/30 space-y-1.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-black text-primary">1</span>
                <p className="font-bold text-xs text-foreground">Upload Resources</p>
                <p className="text-xs text-muted-foreground leading-normal">
                  Upload lesson worksheets, revision booklets, homework tasks, or study packs in PDF/DOCX format.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/30 space-y-1.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-black text-primary">2</span>
                <p className="font-bold text-xs text-foreground">Set Your Price</p>
                <p className="text-xs text-muted-foreground leading-normal">
                  Choose your pricing or make the downloads free to build trust. Set the currency you want to receive.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/30 space-y-1.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-black text-primary">3</span>
                <p className="font-bold text-xs text-foreground">Instant Delivery</p>
                <p className="text-xs text-muted-foreground leading-normal">
                  When a parent purchases, Yazzow immediately emails them a secure download link and adds the file to their student workspace.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Why Stripe? */}
          <div className="pt-4 border-t border-border/40 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CreditCard className="size-4.5 text-primary" />
              Why Yazzow Uses Stripe Connect
            </h3>
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col sm:flex-row gap-4 items-start">
              <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0 mt-0.5">
                <ShieldCheck className="size-5.5" />
              </div>
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  Direct Tutors-to-Parent Payouts (Zero Commission)
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use <strong>Stripe Connect</strong> so that you receive all your earnings directly. Unlike other platforms, Yazzow <strong>never holds your money</strong>, delays payouts, or takes a commission cut. When a parent buys a resource:
                </p>
                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5">
                  <li>The payment flows straight from the parent&apos;s card to your bank account via Stripe.</li>
                  <li>You receive payout settlements automatically on Stripe&apos;s rolling schedule.</li>
                  <li>Your billing details remain fully PCI-compliant and secured by Stripe&apos;s industry-standard infrastructure.</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
