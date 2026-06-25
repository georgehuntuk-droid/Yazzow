"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { detectUserCurrency, convertAmount, subscribeToCurrencyChange } from "@/lib/currency";
import type { DigitalResource } from "@/lib/types";
import { FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ResourceShelfProps = {
  resources: DigitalResource[];
};

export function ResourceShelf({ resources }: ResourceShelfProps) {
  const firstResCurrency = resources[0]?.currency || "gbp";
  const [currency, setCurrency] = useState(firstResCurrency);

  useEffect(() => {
    setCurrency(detectUserCurrency(firstResCurrency));
    return subscribeToCurrencyChange((newCurr) => setCurrency(newCurr));
  }, [firstResCurrency]);

  const getDisplayPrice = (cents: number, fromCurrency: string) => {
    const { amountCents } = convertAmount(cents, fromCurrency, currency);
    return formatMoney(amountCents, currency);
  };

  if (resources.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
        No worksheet packs listed yet.
      </p>
    );
  }

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
          
          <CardFooter className="flex flex-col gap-2.5 border-t border-border/40 pt-4 px-6 pb-6">
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
            <p className="text-xs text-muted-foreground leading-normal">
              {resource.priceCents === 0
                ? "Message your tutor to request a copy of this free worksheet pack."
                : "Message your tutor to arrange payment and receive this pack — purchases are not processed on Yazzow."}
            </p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
