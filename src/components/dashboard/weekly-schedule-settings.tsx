"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, CalendarClock, Loader2, Info, AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createScheduleRule,
  deleteScheduleRule,
  saveGeneratedSlotsAction,
  getScheduleRules,
} from "@/lib/dashboard/actions";

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

interface ScheduleRule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export function WeeklyScheduleSettings() {
  const router = useRouter();
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Add rule form state
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("17:00");
  
  // Generate slots state
  const [weeksAhead, setWeeksAhead] = useState<number>(4);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    setLoading(true);
    setError(null);
    try {
      const result = await getScheduleRules();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRules(result.rules);
    } catch {
      setError("Failed to fetch recurring schedule rules.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading("add");
    setError(null);
    setSuccess(null);

    try {
      const result = await createScheduleRule({
        dayOfWeek,
        startTime,
        endTime,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess("Weekly standard hour rule added successfully!");
      // Reset form
      setDayOfWeek(1);
      setStartTime("14:00");
      setEndTime("17:00");
      
      // Refresh list
      await fetchRules();
      router.refresh();
    } catch {
      setError("Failed to create weekly standard hour rule.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteRule(ruleId: string) {
    if (!confirm("Are you sure you want to remove this weekly standard hour rule?")) return;

    setActionLoading(`delete-${ruleId}`);
    setError(null);
    setSuccess(null);

    try {
      const result = await deleteScheduleRule(ruleId);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess("Weekly rule removed.");
      await fetchRules();
      router.refresh();
    } catch {
      setError("Failed to delete weekly standard hour rule.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleGenerateSlots() {
    setActionLoading("generate");
    setError(null);
    setSuccess(null);

    try {
      const now = new Date();
      const candidateSlots: { startsAt: string; endsAt: string }[] = [];
      
      for (const rule of rules) {
        // Use <= to query exactly weeksAhead * 7 days inclusive of boundary
        for (let d = 0; d <= weeksAhead * 7; d++) {
          const currentDay = new Date(now);
          currentDay.setDate(now.getDate() + d);
          if (currentDay.getDay() === rule.day_of_week) {
            const [startH, startM] = rule.start_time.split(":");
            const [endH, endM] = rule.end_time.split(":");

            const startsAt = new Date(currentDay);
            startsAt.setHours(parseInt(startH, 10), parseInt(startM, 10), 0, 0);

            const endsAt = new Date(currentDay);
            endsAt.setHours(parseInt(endH, 10), parseInt(endM, 10), 0, 0);

            if (startsAt > now) {
              let cursor = startsAt.getTime();
              const endMs = endsAt.getTime();
              const durationMs = 60 * 60 * 1000; // 1 hour
              
              while (cursor + durationMs <= endMs) {
                candidateSlots.push({
                  startsAt: new Date(cursor).toISOString(),
                  endsAt: new Date(cursor + durationMs).toISOString(),
                });
                cursor += durationMs;
              }
            }
          }
        }
      }

      if (candidateSlots.length === 0) {
        setError("No upcoming time slots match your recurring weekly rules.");
        setActionLoading(null);
        return;
      }

      const result = await saveGeneratedSlotsAction(candidateSlots, weeksAhead);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(result.message);
      router.refresh();
    } catch {
      setError("Failed to generate slots from standard rules.");
    } finally {
      setActionLoading(null);
    }
  }

  const formatTimeStr = (time: string) => {
    const parts = time.split(":");
    return `${parts[0]}:${parts[1]}`;
  };

  const getDayName = (dayNum: number) => {
    return WEEKDAYS.find((d) => d.value === dayNum)?.label ?? "Unknown";
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium flex items-start gap-2.5">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 font-semibold flex items-start gap-2.5" role="status">
          <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Standard Hours Manager */}
        <Card className="border border-border/60 bg-card/40">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Weekly Standard Hours</CardTitle>
            <CardDescription>
              Configure the hours you are usually available each week. You can then apply this schedule to automatically populate your calendar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Add Rule Form */}
            <form onSubmit={handleAddRule} className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 bg-muted/20 p-4 rounded-xl border border-border/40">
              <div className="space-y-1.5">
                <label htmlFor="rule-day" className="text-xs font-semibold text-foreground">
                  Day
                </label>
                <select
                  id="rule-day"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                  className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {WEEKDAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="rule-start" className="text-xs font-semibold text-foreground">
                  From
                </label>
                <Input
                  id="rule-start"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="rule-end" className="text-xs font-semibold text-foreground">
                  Until
                </label>
                <Input
                  id="rule-end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 bg-background"
                />
              </div>
              <div className="flex flex-col justify-end">
                <Button
                  type="submit"
                  disabled={actionLoading === "add"}
                  className="w-full h-9 rounded-xl bg-primary text-white font-bold cursor-pointer"
                >
                  {actionLoading === "add" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="size-4 mr-1.5" />
                      Add Rule
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Rules List */}
            {loading ? (
              <div className="py-12 flex justify-center text-muted-foreground text-sm gap-2 items-center">
                <Loader2 className="size-5 animate-spin text-primary" />
                Loading rules...
              </div>
            ) : rules.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/80 bg-muted/10 px-4 py-12 text-center text-sm text-muted-foreground">
                No standard weekly hours configured yet. Add your standard hours above.
              </p>
            ) : (
              <ul className="divide-y divide-border/60 border border-border/50 rounded-xl bg-background overflow-hidden shadow-sm">
                {rules.map((rule) => {
                  const isDeleting = actionLoading === `delete-${rule.id}`;
                  return (
                    <li key={rule.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/10">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex size-2 rounded-full bg-primary" />
                        <span className="font-bold text-foreground w-24">
                          {getDayName(rule.day_of_week)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatTimeStr(rule.start_time)} – {formatTimeStr(rule.end_time)}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={actionLoading !== null}
                        onClick={() => handleDeleteRule(rule.id)}
                        className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 size-8 p-0"
                        aria-label="Delete weekly rule"
                      >
                        {isDeleting ? (
                          <Loader2 className="size-4 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Apply Weekly Schedule batch-generation */}
        <Card className="border border-primary/20 shadow-md">
          <CardHeader className="pb-3 bg-primary/5 border-b border-primary/10 flex flex-row items-center gap-2">
            <CalendarClock className="size-5.5 text-primary shrink-0" />
            <div>
              <CardTitle className="text-sm uppercase tracking-wider text-primary">Apply Schedule</CardTitle>
              <CardDescription className="text-xs text-primary/80 mt-0.5">
                Generate slots in bulk
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Applying your standard hours will search for upcoming matches and create bookable 1-hour slots on your calendar. Any existing slots will be skipped to prevent duplicates.
            </p>
            
            <div className="space-y-2">
              <label htmlFor="weeks-ahead" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Time Period (Generate Ahead)
              </label>
              <select
                id="weeks-ahead"
                value={weeksAhead}
                onChange={(e) => setWeeksAhead(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value={2}>Next 2 Weeks</option>
                <option value={4}>Next 4 Weeks (default)</option>
                <option value={8}>Next 8 Weeks</option>
                <option value={12}>Next 12 Weeks</option>
              </select>
            </div>

            <Button
              type="button"
              onClick={handleGenerateSlots}
              disabled={actionLoading !== null || rules.length === 0}
              className="w-full h-11 text-sm font-bold bg-primary text-white shadow-sm hover:shadow-md transition-all rounded-lg"
            >
              {actionLoading === "generate" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Generating Slots…
                </span>
              ) : (
                "Apply Weekly Standard Hours"
              )}
            </Button>

            <div className="flex gap-2.5 p-3 rounded-lg bg-muted/20 border border-border/40 text-[11px] text-muted-foreground leading-normal">
              <Info className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Tip:</strong> Keep your standard hours up-to-date, then apply them once a month to ensure your calendar is populated in advance.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
