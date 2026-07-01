"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Clock, CreditCard, CheckCircle2, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleBookingPaidStatus } from "@/lib/dashboard/actions";
import { cn } from "@/lib/utils";

type BookingRow = {
  id: string;
  amount_cents: number;
  stripe_payment_intent_id: string | null;
  status: string;
  is_paid: boolean;
  parent_email: string;
  student_name?: string | null;
  created_at: string;
  availability_slots: {
    starts_at: string;
    ends_at: string;
  } | null;
};

type PurchaseRow = {
  id: string;
  amount_cents: number;
  created_at: string;
};

type EarningsAnalyticsProps = {
  bookings: BookingRow[];
  purchases: PurchaseRow[];
  currency: string;
};

export function EarningsAnalytics({ bookings, purchases, currency }: EarningsAnalyticsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "12m">("7d");
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number; amount: number; label: string } | null>(null);

  const format = (cents: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  };

  // 1. Calculate Summary Metrics
  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  
  // Paid: Stripe checkouts + Paid Cash bookings + Digital resources
  const stripePaid = activeBookings
    .filter((b) => b.stripe_payment_intent_id && b.stripe_payment_intent_id !== "cash")
    .reduce((sum, b) => sum + b.amount_cents, 0);

  const cashPaid = activeBookings
    .filter((b) => b.stripe_payment_intent_id === "cash" && b.is_paid)
    .reduce((sum, b) => sum + b.amount_cents, 0);

  const digitalPaid = purchases.reduce((sum, p) => sum + p.amount_cents, 0);
  const totalPaid = stripePaid + cashPaid + digitalPaid;

  // Due: Unpaid Cash bookings
  const totalDue = activeBookings
    .filter((b) => b.stripe_payment_intent_id === "cash" && !b.is_paid)
    .reduce((sum, b) => sum + b.amount_cents, 0);

  const totalGross = totalPaid + totalDue;

  // 2. Prepare Graph Data based on Timeframe
  const getGraphData = () => {
    const now = new Date();
    const dataPoints: { label: string; amount: number; date: Date }[] = [];

    if (timeframe === "7d") {
      // Last 7 days including today
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        
        const label = d.toLocaleDateString("en-GB", { weekday: "short" });
        dataPoints.push({ label, amount: 0, date: d });
      }

      // Populate amounts (paid only)
      activeBookings.forEach((b) => {
        const isPaid = (b.stripe_payment_intent_id && b.stripe_payment_intent_id !== "cash") || b.is_paid;
        if (!isPaid) return;
        const bDate = new Date(b.created_at);
        const pt = dataPoints.find(
          (p) => p.date.getDate() === bDate.getDate() && p.date.getMonth() === bDate.getMonth()
        );
        if (pt) pt.amount += b.amount_cents;
      });

      purchases.forEach((p) => {
        const pDate = new Date(p.created_at);
        const pt = dataPoints.find(
          (pt) => pt.date.getDate() === pDate.getDate() && pt.date.getMonth() === pDate.getMonth()
        );
        if (pt) pt.amount += p.amount_cents;
      });

    } else if (timeframe === "30d") {
      // Last 30 days grouped in 5 blocks (weeks)
      for (let i = 4; i >= 0; i--) {
        const dEnd = new Date();
        dEnd.setDate(now.getDate() - i * 6);
        const dStart = new Date();
        dStart.setDate(dEnd.getDate() - 5);
        dStart.setHours(0, 0, 0, 0);
        dEnd.setHours(23, 59, 59, 999);

        const label = `Wk -${i}`;
        dataPoints.push({ label, amount: 0, date: dStart });

        activeBookings.forEach((b) => {
          const isPaid = (b.stripe_payment_intent_id && b.stripe_payment_intent_id !== "cash") || b.is_paid;
          if (!isPaid) return;
          const bDate = new Date(b.created_at);
          if (bDate >= dStart && bDate <= dEnd) {
            dataPoints[dataPoints.length - 1].amount += b.amount_cents;
          }
        });

        purchases.forEach((p) => {
          const pDate = new Date(p.created_at);
          if (pDate >= dStart && pDate <= dEnd) {
            dataPoints[dataPoints.length - 1].amount += p.amount_cents;
          }
        });
      }

    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString("en-GB", { month: "short" });
        dataPoints.push({ label, amount: 0, date: d });
      }

      activeBookings.forEach((b) => {
        const isPaid = (b.stripe_payment_intent_id && b.stripe_payment_intent_id !== "cash") || b.is_paid;
        if (!isPaid) return;
        const bDate = new Date(b.created_at);
        const pt = dataPoints.find(
          (p) => p.date.getMonth() === bDate.getMonth() && p.date.getFullYear() === bDate.getFullYear()
        );
        if (pt) pt.amount += b.amount_cents;
      });

      purchases.forEach((p) => {
        const pDate = new Date(p.created_at);
        const pt = dataPoints.find(
          (pt) => pt.date.getMonth() === pDate.getMonth() && pt.date.getFullYear() === pDate.getFullYear()
        );
        if (pt) pt.amount += p.amount_cents;
      });
    }

    return dataPoints;
  };

  const graphData = getGraphData();
  const maxAmount = Math.max(...graphData.map((d) => d.amount), 100);

  // SVG Chart Layout Metrics
  const width = 500;
  const height = 140;
  const paddingX = 40;
  const paddingY = 20;

  const points = graphData.map((d, index) => {
    const x = paddingX + (index / (graphData.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (d.amount / maxAmount) * (height - paddingY * 2);
    return { x, y, amount: d.amount, label: d.label };
  });

  // Construct line path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  // 3. Outstanding Invoices / Unpaid cash bookings
  const unpaidCashBookings = activeBookings.filter(
    (b) => b.stripe_payment_intent_id === "cash" && !b.is_paid
  );

  async function handleTogglePaid(bookingId: string) {
    startTransition(async () => {
      const res = await toggleBookingPaidStatus(bookingId, true);
      if (res.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="yazz-surface border-emerald-500/10 shadow-sm relative overflow-hidden bg-emerald-500/[0.02]">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-500 scale-150">
            <CheckCircle2 className="size-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Revenue Paid
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-emerald-600">
              {format(totalPaid)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Settled Stripe checkouts &amp; direct cash
            </p>
          </CardContent>
        </Card>

        <Card className="yazz-surface border-amber-500/10 shadow-sm relative overflow-hidden bg-amber-500/[0.02]">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500 scale-150">
            <Clock className="size-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Money Due (Receivables)
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-amber-600">
              {format(totalDue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Pending cash / bank transfer lessons
            </p>
          </CardContent>
        </Card>

        <Card className="yazz-surface border-primary/10 shadow-sm relative overflow-hidden bg-primary/[0.02]">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-primary scale-150">
            <TrendingUp className="size-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Volume
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-primary">
              {format(totalGross)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-primary" />
              All confirmed bookings &amp; pack downloads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graph Panel */}
      <Card className="yazz-surface border-border/60 shadow-sm">
        <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground">Revenue Analytics</CardTitle>
            <CardDescription className="text-xs">
              Visual overview of paid lessons and package purchases.
            </CardDescription>
          </div>
          <div className="flex gap-1.5 bg-muted p-1 rounded-xl border border-border/40 shrink-0 self-start sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setTimeframe("7d"); setHoveredPoint(null); }}
              className={cn("h-7 px-3 text-[10px] font-bold rounded-lg transition-all", timeframe === "7d" ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}
            >
              7 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setTimeframe("30d"); setHoveredPoint(null); }}
              className={cn("h-7 px-3 text-[10px] font-bold rounded-lg transition-all", timeframe === "30d" ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}
            >
              30 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setTimeframe("12m"); setHoveredPoint(null); }}
              className={cn("h-7 px-3 text-[10px] font-bold rounded-lg transition-all", timeframe === "12m" ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}
            >
              12 Months
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {/* SVG Graph rendering */}
          {points.length === 0 || maxAmount <= 100 ? (
            <div className="h-[150px] flex items-center justify-center border border-dashed border-border/50 rounded-2xl bg-muted/10 text-xs text-muted-foreground font-semibold">
              No sales activity data found for this period.
            </div>
          ) : (
            <div className="relative">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Y Axis Grid Lines */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((ratio, idx) => {
                  const y = height - paddingY - ratio * (height - paddingY * 2);
                  return (
                    <line
                      key={idx}
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="text-border/30"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Area under the line */}
                {areaPath && (
                  <path d={areaPath} fill="url(#chartGradient)" />
                )}

                {/* Smooth Chart Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="rgb(59, 130, 246)"
                    stroke="white"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:r-[6.5] transition-all"
                    onMouseEnter={() => setHoveredPoint({ index: idx, x: p.x, y: p.y, amount: p.amount, label: p.label })}
                  />
                ))}

                {/* Bottom X Labels */}
                {points.map((p, idx) => {
                  // limit rendering of X labels to prevent overcrowding on 30d
                  if (timeframe === "30d" && idx % 2 !== 0) return null;
                  return (
                    <text
                      key={idx}
                      x={p.x}
                      y={height - 4}
                      textAnchor="middle"
                      className="fill-muted-foreground font-semibold text-[8px] sm:text-[9px]"
                    >
                      {p.label}
                    </text>
                  );
                })}
              </svg>

              {/* Hover Tooltip popup */}
              {hoveredPoint && (
                <div
                  className="absolute p-2 rounded-xl bg-card border border-border shadow-md text-[10px] space-y-0.5 pointer-events-none transform -translate-x-1/2 -translate-y-full z-10 animate-in fade-in zoom-in-95 duration-100"
                  style={{
                    left: `${(hoveredPoint.x / width) * 100}%`,
                    top: `${(hoveredPoint.y / height) * 100 - 4}%`,
                  }}
                >
                  <p className="font-bold text-foreground">{hoveredPoint.label}</p>
                  <p className="font-black text-primary">{format(hoveredPoint.amount)}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash Bookings Ledger Section */}
      <Card className="yazz-surface border-border/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-lg">💵</span>
            <div>
              <CardTitle className="text-base font-bold text-foreground">Money Due (Cash &amp; Bank Ledger)</CardTitle>
              <CardDescription className="text-xs">
                Review and record payments for cash or bank transfer bookings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {unpaidCashBookings.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground font-semibold leading-relaxed">
              No outstanding cash payments! All bank transfer bookings have been settled.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {unpaidCashBookings.map((booking) => {
                const startsAt = booking.availability_slots?.starts_at;
                const formattedDate = startsAt
                  ? new Date(startsAt).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Date TBD";

                return (
                  <div key={booking.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {booking.student_name || "Pupil"}
                        </span>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200/60 shadow-inner">
                          Unpaid
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {booking.parent_email} • {formattedDate}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className="font-black text-sm text-foreground shrink-0">
                        {format(booking.amount_cents)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleTogglePaid(booking.id)}
                        className="h-8 rounded-lg text-[10px] font-bold border-primary/20 hover:bg-primary hover:text-white transition-all cursor-pointer"
                      >
                        {isPending ? (
                          <RefreshCw className="size-3 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="size-3 text-emerald-600 mr-1 group-hover:text-white" />
                        )}
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
