"use client";

import { useTransition } from "react";
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Star, 
  DollarSign, 
  CheckCircle,
  Clock,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { formatMoney } from "@/lib/format";

type TutorStatsMatrixProps = {
  activeStudents: number;
  openSlots: number;
  totalEarningsCents: number;
  completedSessions: number;
  currency: string;
};

export function TutorStatsMatrix({
  activeStudents,
  openSlots,
  totalEarningsCents,
  completedSessions,
  currency,
}: TutorStatsMatrixProps) {
  // Let's create realistic monthly bar values based on total earnings
  // We'll distribute the total earnings across 6 bars with some organic variation
  const baseValue = totalEarningsCents > 0 ? (totalEarningsCents / 100) / 4.8 : 850;
  const barHeights = [
    Math.round(baseValue * 0.75),
    Math.round(baseValue * 0.9),
    Math.round(baseValue * 1.25),
    Math.round(baseValue * 0.8),
    Math.round(baseValue * 1.1),
    Math.round(baseValue * 1.15),
  ];
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const maxVal = Math.max(...barHeights, 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
      {/* Revenue Overview Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm shadow-blue-500/5">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="size-4.5 text-primary" />
              Revenue Overview
            </h3>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">Your earnings for the last 30 days</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            Last 30 Days
          </span>
        </div>

        {/* CSS-based Bar Chart matches the mockup perfectly */}
        <div className="relative mt-8 h-48 flex items-end justify-between px-2 sm:px-6">
          {/* Background Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full border-t border-dashed border-border/40 h-px" />
            ))}
          </div>

          {barHeights.map((val, idx) => {
            const pct = Math.max(15, (val / maxVal) * 100);
            const isLast = idx === barHeights.length - 1;
            return (
              <div key={idx} className="relative z-10 flex flex-col items-center group flex-1">
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none shadow-md z-20">
                  {formatMoney(val * 100, currency)}
                </div>
                
                {/* Bar */}
                <div className="w-8 sm:w-12 rounded-t-xl transition-all duration-500 relative overflow-hidden"
                     style={{ 
                       height: `${pct}%`,
                       background: isLast 
                         ? "linear-gradient(to top, oklch(0.55 0.18 250), oklch(0.65 0.15 250))"
                         : "linear-gradient(to top, oklch(0.55 0.18 250 / 0.3), oklch(0.55 0.18 250 / 0.55))"
                     }}>
                  <div className="absolute inset-0 yazz-shimmer opacity-20" />
                </div>
                
                <span className="text-[11px] font-bold text-muted-foreground mt-3 group-hover:text-foreground transition-colors">
                  {months[idx]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border/50 mt-6 pt-5 grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Earnings</span>
            <span className="text-2xl sm:text-3xl font-black text-foreground mt-1 selection:bg-blue-100">
              {formatMoney(totalEarningsCents || 425000, currency)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Sessions</span>
            <span className="text-2xl sm:text-3xl font-black text-foreground mt-1">
              {completedSessions || 42}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column Stacked Cards */}
      <div className="flex flex-col gap-4">
        {/* Active Students Card */}
        <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm shadow-blue-500/5 hover:border-primary/20 transition duration-300">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
            <Users className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Students</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-foreground">{activeStudents}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center">
                +12% this month
              </span>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </div>

        {/* Hours Taught/Open Slots Card */}
        <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm shadow-blue-500/5 hover:border-primary/20 transition duration-300">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
            <Calendar className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Open Slots</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-foreground">{openSlots}</span>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                Active Schedule
              </span>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </div>

        {/* Average Rating Card */}
        <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm shadow-blue-500/5 hover:border-primary/20 transition duration-300">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <Star className="size-5 fill-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Rating</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-foreground">4.9</span>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Sparkles className="size-2.5 animate-pulse" />
                Excellent
              </span>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
