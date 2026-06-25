"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Check, 
  X, 
  Send,
  PlusCircle,
  Bell
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LESSON_SLOT_DURATION_MINUTES } from "@/lib/constants";
import { 
  createAvailabilitySlot, 
  deleteAvailabilitySlot,
  bookSlotManually,
  cancelBooking,
  notifyRunningLate,
  sendLessonReminderAction
} from "@/lib/dashboard/actions";
import { countHourlySlots } from "@/lib/scheduling/hourly-slots";
import { formatSlotRange } from "@/lib/format";
import type { TutorSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

type ScheduleEditorProps = {
  slots: TutorSlot[];
};

export function ScheduleEditor({ slots }: ScheduleEditorProps) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("17:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Slot-specific states for manual booking & running late forms
  const [activeManualBookId, setActiveManualBookId] = useState<string | null>(null);
  const [activeRunningLateId, setActiveRunningLateId] = useState<string | null>(null);
  const [manualParentEmail, setManualParentEmail] = useState("");
  const [manualStudentName, setManualStudentName] = useState("");
  const [lateMessage, setLateMessage] = useState("5-10 minutes");
  const [slotActionLoading, setSlotActionLoading] = useState<string | null>(null);
  const [slotMessage, setSlotMessage] = useState<{ id: string; type: "error" | "success"; text: string } | null>(null);

  const previewCount = useMemo(() => {
    if (!date || !startTime || !endTime) return 0;
    const startsAt = new Date(`${date}T${startTime}`);
    const endsAt = new Date(`${date}T${endTime}`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return 0;
    return countHourlySlots(startsAt, endsAt);
  }, [date, startTime, endTime]);

  const groupedSlots = useMemo(() => {
    const groups: { [dateKey: string]: TutorSlot[] } = {};
    
    // Sort slots by startsAt date in ascending order
    const sortedSlots = [...slots].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
    
    sortedSlots.forEach((slot) => {
      const dateObj = new Date(slot.startsAt);
      const dateKey = dateObj.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(slot);
    });
    return Object.entries(groups);
  }, [slots]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const startsAt = new Date(`${date}T${startTime}`);
    const endsAt = new Date(`${date}T${endTime}`);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError("Invalid date or time.");
      setLoading(false);
      return;
    }

    const result = await createAvailabilitySlot({
      startsAtIso: startsAt.toISOString(),
      endsAtIso: endsAt.toISOString(),
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess("message" in result ? result.message : "Slots added.");
    setDate("");
    router.refresh();
    setLoading(false);
  }

  async function handleDelete(slotId: string) {
    if (!confirm("Remove this open slot?")) return;

    setSlotActionLoading(`delete-${slotId}`);
    setSlotMessage(null);
    const result = await deleteAvailabilitySlot(slotId);
    setSlotActionLoading(null);

    if (!result.ok) {
      setSlotMessage({ id: slotId, type: "error", text: result.error });
      return;
    }

    setSlotMessage({ id: slotId, type: "success", text: "Slot deleted successfully." });
    router.refresh();
  }

  async function handleManualBook(slotId: string) {
    if (!manualParentEmail.trim()) {
      setSlotMessage({ id: slotId, type: "error", text: "Parent email is required." });
      return;
    }

    setSlotActionLoading(`book-${slotId}`);
    setSlotMessage(null);

    const result = await bookSlotManually({
      slotId,
      parentEmail: manualParentEmail,
      studentName: manualStudentName || undefined,
    });

    setSlotActionLoading(null);

    if (!result.ok) {
      setSlotMessage({ id: slotId, type: "error", text: result.error });
      return;
    }

    setSlotMessage({ id: slotId, type: "success", text: "Slot booked successfully!" });
    setManualParentEmail("");
    setManualStudentName("");
    setActiveManualBookId(null);
    router.refresh();
  }

  async function handleCancelBooking(bookingId: string, slotId: string) {
    if (!confirm("Are you sure you want to cancel this booking? This will reopen the hour slot and notify the family.")) return;

    setSlotActionLoading(`cancel-${slotId}`);
    setSlotMessage(null);

    const result = await cancelBooking(bookingId);
    setSlotActionLoading(null);

    if (!result.ok) {
      setSlotMessage({ id: slotId, type: "error", text: result.error });
      return;
    }

    setSlotMessage({ id: slotId, type: "success", text: "Booking cancelled. Slot is now open." });
    router.refresh();
  }

  async function handleSendLateNotice(bookingId: string, slotId: string) {
    setSlotActionLoading(`late-${slotId}`);
    setSlotMessage(null);

    const result = await notifyRunningLate(bookingId, lateMessage);
    setSlotActionLoading(null);

    if (!result.ok) {
      setSlotMessage({ id: slotId, type: "error", text: result.error });
      return;
    }

    setSlotMessage({ id: slotId, type: "success", text: result.message ?? "Running late notice sent!" });
    setActiveRunningLateId(null);
    router.refresh();
  }

  async function handleSendReminder(bookingId: string, slotId: string) {
    setSlotActionLoading(`reminder-${slotId}`);
    setSlotMessage(null);

    const result = await sendLessonReminderAction(bookingId);
    setSlotActionLoading(null);

    if (!result.ok) {
      setSlotMessage({ id: slotId, type: "error", text: result.error });
      return;
    }

    setSlotMessage({ id: slotId, type: "success", text: "Lesson reminder sent!" });
    router.refresh();
  }

  return (
    <Card className="yazz-surface">
      <CardHeader>
        <CardTitle className="font-heading">Availability (1-hour slots)</CardTitle>
        <CardDescription>
          Block out an afternoon — we split it into {LESSON_SLOT_DURATION_MINUTES}-minute
          bookable lessons. Parents can only book one hour at a time, not your whole block.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Slot Addition Form */}
        <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-muted/20 p-5 rounded-2xl border border-border/40">
          <div className="space-y-2">
            <label htmlFor="slot-date" className="text-sm font-semibold text-foreground">
              Date
            </label>
            <Input
              id="slot-date"
              type="date"
              required
              value={date}
              className="rounded-xl border-border/80 bg-background"
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="slot-start" className="text-sm font-semibold text-foreground">
              From
            </label>
            <Input
              id="slot-start"
              type="time"
              required
              value={startTime}
              className="rounded-xl border-border/80 bg-background"
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="slot-end" className="text-sm font-semibold text-foreground">
              Until
            </label>
            <Input
              id="slot-end"
              type="time"
              required
              value={endTime}
              className="rounded-xl border-border/80 bg-background"
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full rounded-xl bg-primary hover:bg-primary/95 text-white shadow-sm" disabled={loading || previewCount === 0}>
              {loading
                ? "Adding…"
                : previewCount > 0
                  ? `Add ${previewCount} Hour Slot${previewCount === 1 ? "" : "s"}`
                  : "Add Slots"}
            </Button>
          </div>
        </form>

        {previewCount > 0 ? (
          <p className="text-xs font-semibold text-primary px-1 flex items-center gap-1.5 animate-pulse">
            <PlusCircle className="size-3.5" />
            This creates {previewCount} separate one-hour booking slots on your public calendar.
          </p>
        ) : date ? (
          <p className="text-xs font-semibold text-amber-600 px-1 flex items-center gap-1.5">
            <AlertCircle className="size-3.5" />
            End time must be whole hours after start (e.g. 2pm–5pm = 3 slots).
          </p>
        ) : null}

        {error ? <p className="text-sm font-semibold text-destructive px-1">{error}</p> : null}
        {success ? (
          <p className="text-sm font-semibold text-emerald-600 px-1" role="status">
            {success}
          </p>
        ) : null}

        {/* Interactive Slots Listing */}
        {slots.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-12 text-center text-sm font-semibold text-muted-foreground">
            No upcoming slots. Add some availability above to let families book you!
          </p>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 border-b border-border/30 pb-2">Upcoming Schedule</h3>
            
            {groupedSlots.map(([dateLabel, daySlots]) => (
              <div key={dateLabel} className="space-y-3">
                <div className="flex items-center gap-2 px-1 pt-2">
                  <Calendar className="size-4 text-primary/70" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    {dateLabel}
                  </h4>
                </div>
                <ul className="space-y-3">
                  {daySlots.map((slot) => {
                    const isBooked = slot.isBooked && slot.booking;
                    const isManualFormOpen = activeManualBookId === slot.id;
                    const isLateFormOpen = activeRunningLateId === slot.id;
                    const isActionLoading = slotActionLoading?.includes(slot.id);
                    const hasMessage = slotMessage?.id === slot.id;

                    const timeFormatter = (isoStr: string) => {
                      return new Date(isoStr).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    };

                    return (
                      <li
                        key={slot.id}
                        className={cn(
                          "rounded-2xl border transition-all duration-300 overflow-hidden",
                          isBooked
                            ? "border-blue-200 bg-blue-50/20 shadow-sm shadow-blue-500/5"
                            : "border-border/80 bg-card hover:border-primary/20 hover:shadow-sm"
                        )}
                      >
                        {/* Main Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                                <Clock className={cn("size-4", isBooked ? "text-primary" : "text-muted-foreground")} />
                                {timeFormatter(slot.startsAt)} – {timeFormatter(slot.endsAt)}
                              </p>
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                  isBooked 
                                    ? "bg-blue-100 text-primary dark:bg-blue-950/50" 
                                    : "bg-muted text-muted-foreground border border-border"
                                )}
                              >
                                {isBooked ? "Booked" : "Open Slot"}
                              </Badge>
                            </div>
                            {isBooked ? (
                              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <User className="size-3.5 text-primary" />
                                <span>
                                  Student: <strong className="text-foreground">{slot.booking?.studentName || "GCSE Student"}</strong> · ({slot.booking?.parentEmail})
                                </span>
                              </div>
                            ) : null}
                          </div>

                          {/* Inline Actions Toolbar */}
                          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                            {isBooked ? (
                              <>
                                {/* Running Late Toggle Button */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  className={cn(
                                    "rounded-lg text-xs font-bold border-border/80 gap-1",
                                    isLateFormOpen && "bg-amber-50 border-amber-200 text-amber-600"
                                  )}
                                  disabled={isActionLoading}
                                  onClick={() => {
                                    setActiveRunningLateId(isLateFormOpen ? null : slot.id);
                                    setActiveManualBookId(null);
                                  }}
                                >
                                  <AlertCircle className="size-3.5" />
                                  Running Late
                                </Button>

                                {/* Lesson Reminder Action */}
                                {(() => {
                                  const startsAtDate = new Date(slot.startsAt);
                                  const hoursUntil = (startsAtDate.getTime() - Date.now()) / (1000 * 60 * 60);
                                  const isWithin24Hours = hoursUntil <= 24 && hoursUntil > 0;
                                  const isReminderSent = !!slot.booking?.lessonReminderSentAt;

                                  if (hoursUntil <= 0) return null;

                                  if (isReminderSent) {
                                    return (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="xs"
                                        disabled={true}
                                        className="rounded-lg text-xs font-semibold border-emerald-200 text-emerald-700 bg-emerald-50 cursor-default"
                                      >
                                        ✓ Reminder Sent
                                      </Button>
                                    );
                                  }

                                  return (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="xs"
                                      disabled={!isWithin24Hours || isActionLoading}
                                      onClick={() => handleSendReminder(slot.booking!.id, slot.id)}
                                      className={cn(
                                        "rounded-lg text-xs font-bold gap-1",
                                        isWithin24Hours 
                                          ? "border-primary text-primary hover:bg-primary/5 cursor-pointer" 
                                          : "border-border text-muted-foreground bg-muted/10 cursor-not-allowed"
                                      )}
                                      title={!isWithin24Hours ? "Reminders can be sent up to 24 hours before the lesson starts." : undefined}
                                    >
                                      <Bell className="size-3.5" />
                                      {slotActionLoading === `reminder-${slot.id}` ? "Sending…" : "Send 24h Reminder"}
                                    </Button>
                                  );
                                })()}

                                {/* Cancel Booking Button */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  className="rounded-lg text-xs font-bold text-destructive hover:bg-destructive/5 border-destructive/20"
                                  disabled={isActionLoading}
                                  onClick={() => handleCancelBooking(slot.booking!.id, slot.id)}
                                >
                                  <X className="size-3.5" />
                                  Cancel Booking
                                </Button>
                              </>
                            ) : (
                              <>
                                {/* Book Manually Toggle Button */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  className={cn(
                                    "rounded-lg text-xs font-bold gap-1",
                                    isManualFormOpen && "bg-primary/5 border-primary/30 text-primary"
                                  )}
                                  disabled={isActionLoading}
                                  onClick={() => {
                                    setActiveManualBookId(isManualFormOpen ? null : slot.id);
                                    setActiveRunningLateId(null);
                                  }}
                                >
                                  <User className="size-3.5 text-primary" />
                                  Book Manually
                                </Button>

                                {/* Delete Open Slot Button */}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                  disabled={isActionLoading}
                                  onClick={() => handleDelete(slot.id)}
                                  aria-label="Delete slot"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Inline Form Panels */}
                        {isManualFormOpen && (
                          <div className="border-t border-border/60 bg-muted/10 p-4.5 space-y-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <User className="size-3.5 text-primary" />
                              Book open slot manually
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground">Parent Email</label>
                                <Input
                                  type="email"
                                  placeholder="parent@example.com"
                                  value={manualParentEmail}
                                  required
                                  className="rounded-xl bg-background border-border/80 h-9.5 text-xs"
                                  onChange={(e) => setManualParentEmail(e.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground">Student Name (optional)</label>
                                <Input
                                  type="text"
                                  placeholder="Leo Chen"
                                  value={manualStudentName}
                                  className="rounded-xl bg-background border-border/80 h-9.5 text-xs"
                                  onChange={(e) => setManualStudentName(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-lg text-xs font-bold"
                                onClick={() => setActiveManualBookId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-lg text-xs font-bold bg-primary text-white"
                                disabled={isActionLoading}
                                onClick={() => handleManualBook(slot.id)}
                              >
                                {isActionLoading ? "Booking..." : "Confirm Booking"}
                              </Button>
                            </div>
                          </div>
                        )}

                        {isLateFormOpen && (
                          <div className="border-t border-border/60 bg-muted/10 p-4.5 space-y-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <Clock className="size-3.5 text-amber-500" />
                              Notify parent you are running late
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Input
                                type="text"
                                placeholder="e.g. 5-10 minutes, sorry for any inconvenience!"
                                value={lateMessage}
                                className="rounded-xl bg-background border-border/80 text-xs flex-1"
                                onChange={(e) => setLateMessage(e.target.value)}
                              />
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-xl text-xs font-bold bg-primary text-white px-4 gap-1.5"
                                disabled={isActionLoading}
                                onClick={() => handleSendLateNotice(slot.booking!.id, slot.id)}
                              >
                                <Send className="size-3.5" />
                                Send Notice
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Inline Status Messages */}
                        {hasMessage && (
                          <div className={cn(
                            "border-t px-4.5 py-2.5 text-xs font-semibold flex items-center gap-1.5",
                            slotMessage.type === "error" 
                              ? "bg-destructive/5 text-destructive border-destructive/10" 
                              : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          )}>
                            {slotMessage.type === "error" ? <AlertCircle className="size-3.5 shrink-0" /> : <Check className="size-3.5 shrink-0" />}
                            <span>{slotMessage.text}</span>
                            <button 
                              className="ml-auto text-muted-foreground hover:text-foreground"
                              onClick={() => setSlotMessage(null)}
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
