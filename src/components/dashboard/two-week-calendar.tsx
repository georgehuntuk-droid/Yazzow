"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  User, 
  Trash2, 
  AlertCircle, 
  Check, 
  X, 
  Send, 
  Bell, 
  CreditCard,
  Coins,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatMoney, formatSlotRange } from "@/lib/format";
import { detectUserCurrency, convertAmount, subscribeToCurrencyChange } from "@/lib/currency";
import { 
  deleteAvailabilitySlot, 
  bookSlotManually, 
  cancelBooking, 
  notifyRunningLate, 
  sendLessonReminderAction,
  moveAvailabilitySlotAction,
  createAvailabilitySlot
} from "@/lib/dashboard/actions";
import { cancelBookingByStudent } from "@/lib/dashboard/actions";

const getDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export type CalendarSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  isBooked: boolean;
  booking?: {
    id: string;
    parentEmail: string;
    studentName: string | null;
    status: string;
    runningLateSentAt: string | null;
    runningLateNote: string | null;
    studentRunningLateSentAt: string | null;
    studentRunningLateNote: string | null;
    lessonReminderSentAt: string | null;
  } | null;
};

type TwoWeekCalendarProps = {
  role: "tutor" | "student";
  slots: CalendarSlot[];
  tutor: {
    id: string;
    username: string;
    displayName: string;
    lessonPriceCents: number;
    currency: string;
    allowCashPayments?: boolean;
  };
  // Student-specific props
  parentEmail?: string;
  studentName?: string;
  studentCredits?: number;
  creditLimit?: number;
  paymentsEnabled?: boolean;
};

export function TwoWeekCalendar({
  role,
  slots,
  tutor,
  parentEmail = "",
  studentName = "",
  studentCredits = 0,
  creditLimit = 0,
  paymentsEnabled = true
}: TwoWeekCalendarProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setMounted(true);
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  const [, startTransition] = useTransition();
  const [selectedWeek, setSelectedWeek] = useState<"week1" | "week2">("week1");
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [draggedOverDate, setDraggedOverDate] = useState<string | null>(null);

  const [localSlots, setLocalSlots] = useState<CalendarSlot[]>(slots);

  useEffect(() => {
    setLocalSlots(slots);
  }, [slots]);

  const handleMoveSlot = async (slotId: string, targetDateKey: string, targetHour: number) => {
    const slot = localSlots.find(s => s.id === slotId);
    if (!slot) {
      setErrorMsg("Slot not found.");
      return;
    }

    if (targetHour < minHour || targetHour > maxHour) {
      setErrorMsg("Invalid hour selection.");
      return;
    }

    const start = new Date(slot.startsAt);
    const end = new Date(slot.endsAt);
    const durationMs = end.getTime() - start.getTime();

    // Construct local startsAt date based on targetDateKey (YYYY-MM-DD) and targetHour
    const targetStartsAt = new Date(`${targetDateKey}T${String(targetHour).padStart(2, "0")}:00:00`);
    
    if (Number.isNaN(targetStartsAt.getTime())) {
      setErrorMsg("Invalid date or hour format.");
      return;
    }

    const targetEndsAt = new Date(targetStartsAt.getTime() + durationMs);

    // Save the previous slots state to revert back to on failure
    const previousSlots = [...localSlots];

    // Optimistically update the slot in the local state
    setLocalSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return {
          ...s,
          startsAt: targetStartsAt.toISOString(),
          endsAt: targetEndsAt.toISOString()
        };
      }
      return s;
    }));

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await moveAvailabilitySlotAction({
      slotId,
      startsAtIso: targetStartsAt.toISOString(),
      endsAtIso: targetEndsAt.toISOString(),
    });

    setActionLoading(false);

    if (res.ok) {
      setSuccessMsg("Slot rescheduled successfully.");
      router.refresh();
    } else {
      // Revert back to the previous state on error
      setLocalSlots(previousSlots);
      setErrorMsg(res.error);
    }
  };

  const [currency, setCurrency] = useState(tutor.currency);
  useEffect(() => {
    setCurrency(detectUserCurrency(tutor.currency));
    return subscribeToCurrencyChange((newCurr) => setCurrency(newCurr));
  }, [tutor.currency]);

  const getDisplayPrice = (cents: number) => {
    const { amountCents } = convertAmount(cents, tutor.currency, currency);
    return formatMoney(amountCents, currency);
  };

  // Form states for Modal
  const [manualParentEmail, setManualParentEmail] = useState("");
  const [manualStudentName, setManualStudentName] = useState(role === "student" ? studentName : "");
  const [lateMessage, setLateMessage] = useState("5-10 minutes");
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "card" | "cash">("card");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate 14 days starting from Monday of current week
  const days = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const resultList: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      resultList.push(d);
    }
    return resultList;
  }, []);

  const week1Days = days.slice(0, 7);
  const week2Days = days.slice(7, 14);

  // Calculate dynamic start/end hours for the calendar view
  const { minHour, maxHour } = useMemo(() => {
    let min = 8;
    let max = 19;
    localSlots.forEach((slot) => {
      const start = new Date(slot.startsAt).getHours();
      const end = Math.ceil(new Date(slot.endsAt).getHours() + new Date(slot.endsAt).getMinutes() / 60);
      if (start < min) min = start;
      if (end > max) max = end;
    });
    return { minHour: Math.max(0, min - 1), maxHour: Math.min(24, max + 1) };
  }, [localSlots]);

  const hourHeight = 52; // Height in pixels for one hour
  const calendarHeight = (maxHour - minHour) * hourHeight;

  // Click-and-drag slot builder state & handlers
  const [dragSelect, setDragSelect] = useState<{
    dateKey: string;
    startHour: number;
    endHour: number;
  } | null>(null);

  const getHourFromY = (y: number) => {
    const hourOffset = Math.floor(y / hourHeight);
    return minHour + hourOffset;
  };

  const handleGridMouseDown = (e: React.MouseEvent<HTMLDivElement>, dateKey: string) => {
    if (role !== "tutor" || e.button !== 0) return;
    
    // Ignore if clicked on an existing slot block or target button/interactive element
    if ((e.target as HTMLElement).closest(".slot-block") || (e.target as HTMLElement).closest("button")) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const hour = getHourFromY(clickY);
    
    if (hour >= minHour && hour < maxHour) {
      setDragSelect({
        dateKey,
        startHour: hour,
        endHour: hour + 1
      });
    }
  };

  const handleGridMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragSelect) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentY = e.clientY - rect.top;
    const hour = Math.max(dragSelect.startHour + 1, Math.min(maxHour, Math.round(currentY / hourHeight) + minHour));
    
    if (hour !== dragSelect.endHour) {
      setDragSelect({
        ...dragSelect,
        endHour: hour
      });
    }
  };

  const handleGridMouseUp = async () => {
    if (!dragSelect) return;
    const { dateKey, startHour, endHour } = dragSelect;
    setDragSelect(null);
    
    if (startHour >= endHour) return;
    
    // Construct local timestamps safely
    const startsAt = new Date(`${dateKey}T${String(startHour).padStart(2, "0")}:00:00`);
    const endsAt = new Date(`${dateKey}T${String(endHour).padStart(2, "0")}:00:00`);
    
    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) return;

    // Optimistically paint temporary slot blocks to screen instantly
    const tempSlots: CalendarSlot[] = [];
    for (let hr = startHour; hr < endHour; hr++) {
      const slotStart = new Date(`${dateKey}T${String(hr).padStart(2, "0")}:00:00`);
      const slotEnd = new Date(`${dateKey}T${String(hr + 1).padStart(2, "0")}:00:00`);
      tempSlots.push({
        id: `temp-${Date.now()}-${hr}`,
        startsAt: slotStart.toISOString(),
        endsAt: slotEnd.toISOString(),
        isBooked: false,
        booking: null,
      });
    }

    const previousSlots = [...localSlots];
    setLocalSlots(prev => [...prev, ...tempSlots]);
    
    try {
      const result = await createAvailabilitySlot({
        startsAtIso: startsAt.toISOString(),
        endsAtIso: endsAt.toISOString(),
      });
      if (result.ok) {
        // Silently sync server state in the background
        router.refresh();
      } else {
        // Revert on failure
        setLocalSlots(previousSlots);
        alert(result.error || "Failed to create slot.");
      }
    } catch (err) {
      setLocalSlots(previousSlots);
      alert("Failed to create slot due to network error.");
    }
  };

  // Filter and group slots by date label (YYYY-MM-DD)
  const slotsByDate = useMemo(() => {
    const groups: Record<string, CalendarSlot[]> = {};
    localSlots.forEach((slot) => {
      const d = new Date(slot.startsAt);
      const dateKey = getDateKey(d);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(slot);
    });
    return groups;
  }, [localSlots]);

  // Check if a slot is booked by the current student/parent
  const isMyBooking = (slot: CalendarSlot) => {
    return (
      slot.isBooked &&
      slot.booking?.parentEmail.toLowerCase() === parentEmail.toLowerCase()
    );
  };

  const handleOpenSlotClick = (slot: CalendarSlot) => {
    setSelectedSlot(slot);
    setManualParentEmail("");
    setManualStudentName(role === "student" ? studentName : "");
    setErrorMsg(null);
    setSuccessMsg(null);
    
    // Choose default payment method for student
    const canUseCredit = (studentCredits ?? 0) - 1 >= -(creditLimit ?? 0);
    if (canUseCredit) {
      setPaymentMethod("credit");
    } else if (paymentsEnabled) {
      setPaymentMethod("card");
    } else if (tutor.allowCashPayments !== false) {
      setPaymentMethod("cash");
    } else {
      setPaymentMethod("card");
    }
  };

  // Tutor Actions
  const handleTutorDeleteSlot = async (slotId: string, skipConfirm = false) => {
    if (slotId.startsWith("temp-")) return;
    if (!skipConfirm && !confirm("Delete this open slot?")) return;
    
    const previousSlots = [...localSlots];
    
    // Optimistically remove the slot immediately from local state
    setLocalSlots(prev => prev.filter(s => s.id !== slotId));
    setSelectedSlot(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    try {
      const res = await deleteAvailabilitySlot(slotId);
      if (res.ok) {
        // Silently sync server state in the background
        router.refresh();
      } else {
        // Revert on failure
        setLocalSlots(previousSlots);
        alert(res.error || "Failed to delete slot.");
      }
    } catch (err) {
      setLocalSlots(previousSlots);
      alert("Failed to delete slot due to network error.");
    }
  };

  const handleTutorManualBook = async (slotId: string) => {
    if (!manualParentEmail.trim()) {
      setErrorMsg("Parent email is required.");
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    const res = await bookSlotManually({
      slotId,
      parentEmail: manualParentEmail,
      studentName: manualStudentName || undefined,
    });
    setActionLoading(false);
    if (res.ok) {
      setSuccessMsg("Slot booked successfully!");
      router.refresh();
      setTimeout(() => {
        setSelectedSlot(null);
      }, 300);
    } else {
      setErrorMsg(res.error);
    }
  };

  const handleTutorCancelBooking = async (bookingId: string, skipConfirm = false) => {
    if (!skipConfirm && !confirm("Cancel this booking? This will reopen the slot and email the parent.")) return;
    setActionLoading(true);
    setErrorMsg(null);
    const res = await cancelBooking(bookingId);
    setActionLoading(false);
    if (res.ok) {
      setSuccessMsg("Booking cancelled. Slot is open.");
      router.refresh();
      setTimeout(() => {
        setSelectedSlot(null);
      }, 300);
    } else {
      setErrorMsg(res.error);
    }
  };

  const handleTutorSendLateNotice = async (bookingId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    const res = await notifyRunningLate(bookingId, lateMessage);
    setActionLoading(false);
    if (res.ok) {
      setSuccessMsg(res.message ?? "Late notice sent!");
      router.refresh();
      setTimeout(() => {
        setSelectedSlot(null);
      }, 300);
    } else {
      setErrorMsg(res.error);
    }
  };

  const handleTutorSendReminder = async (bookingId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    const res = await sendLessonReminderAction(bookingId);
    setActionLoading(false);
    if (res.ok) {
      setSuccessMsg("Reminder email sent!");
      router.refresh();
      setTimeout(() => {
        setSelectedSlot(null);
      }, 300);
    } else {
      setErrorMsg(res.error);
    }
  };

  // Student Actions
  const handleStudentBookSlot = async (slot: CalendarSlot) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      if (paymentMethod === "credit") {
        const response = await fetch("/api/tutor/book-credit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slotId: slot.id,
            tutorId: tutor.id,
            parentEmail: parentEmail,
            studentName: manualStudentName || undefined,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setErrorMsg(data.error ?? "Failed to book lesson.");
          setActionLoading(false);
          return;
        }
        setSuccessMsg("Lesson booked successfully!");
        router.refresh();
        setTimeout(() => {
          setSelectedSlot(null);
        }, 300);
      } else if (paymentMethod === "cash") {
        const response = await fetch("/api/tutor/book-direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slotId: slot.id,
            tutorId: tutor.id,
            parentEmail: parentEmail,
            studentName: manualStudentName || undefined,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setErrorMsg(data.error ?? "Failed to book lesson.");
          setActionLoading(false);
          return;
        }
        setSuccessMsg("Lesson booked successfully!");
        router.refresh();
        setTimeout(() => {
          setSelectedSlot(null);
        }, 300);
      } else {
        // Stripe checkout
        const response = await fetch("/api/stripe/checkout/lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slotId: slot.id,
            tutorUsername: tutor.username,
            parentEmail: parentEmail,
            studentName: manualStudentName || undefined,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.url) {
          setErrorMsg(data.error ?? "Checkout unavailable.");
          setActionLoading(false);
          return;
        }
        window.location.href = data.url;
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setActionLoading(false);
    }
  };

  const handleStudentCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel your booked lesson?")) return;
    setActionLoading(true);
    setErrorMsg(null);
    const res = await cancelBookingByStudent(bookingId);
    setActionLoading(false);
    if (res.ok) {
      setSuccessMsg("Your lesson has been cancelled successfully.");
      router.refresh();
      setTimeout(() => {
        setSelectedSlot(null);
      }, 300);
    } else {
      setErrorMsg(res.error);
    }
  };

  // Render a single Week Grid (7 columns)
  const renderWeekGrid = (weekDays: Date[], weekLabel: string) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Calendar className="size-4.5 text-primary" />
            {weekLabel} ({weekDays[0].getDate()} {weekDays[0].toLocaleDateString("en-GB", { month: "short" })} – {weekDays[6].getDate()} {weekDays[6].toLocaleDateString("en-GB", { month: "short" })})
          </h4>
          
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 rounded-xl border-border/80 hover:bg-muted text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              disabled={selectedWeek === "week1"}
              onClick={() => setSelectedWeek("week1")}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 rounded-xl border-border/80 hover:bg-muted text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              disabled={selectedWeek === "week2"}
              onClick={() => setSelectedWeek("week2")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Mobile horizontal scroll hint */}
        <div className="lg:hidden flex items-center justify-center gap-1.5 text-[10px] font-bold text-primary/75 bg-primary/5 py-1.5 px-3 rounded-xl w-max mx-auto mb-2 select-none">
          <span>⇄ Swipe horizontally to scroll schedule</span>
        </div>

        <div className="overflow-x-auto border border-border/80 rounded-2xl bg-card shadow-sm">
          <div className="min-w-[760px] flex flex-col">
            {/* Day Headers */}
            <div className="flex border-b border-border/60 bg-muted/20">
              <div className="w-14 shrink-0 border-r border-border/60 sticky left-0 bg-muted/30 z-30" />
              {weekDays.map((day) => {
                const isToday = new Date().toDateString() === day.toDateString();
                return (
                  <div 
                    key={day.toISOString()} 
                    className={cn(
                      "flex-1 text-center py-3 border-r border-border/40 last:border-r-0",
                      isToday && "bg-primary/5"
                    )}
                  >
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
                      isToday ? "text-primary" : "text-muted-foreground"
                    )}>
                      {day.toLocaleDateString("en-GB", { weekday: "short" })}
                    </p>
                    <p className={cn(
                      "text-sm font-bold mt-0.5",
                      isToday ? "text-primary font-black" : "text-foreground"
                    )}>
                      {day.getDate()} {day.toLocaleDateString("en-GB", { month: "short" })}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Time Grid Layout */}
            <div className="flex relative" onMouseLeave={handleGridMouseUp}>
              {/* Sticky Hours Axis */}
              <div 
                className="w-14 shrink-0 border-r border-border/60 sticky left-0 bg-card z-30 text-right pr-2 text-[10px] text-muted-foreground font-semibold select-none relative" 
                style={{ height: `${calendarHeight}px` }}
              >
                {Array.from({ length: maxHour - minHour }).map((_, idx) => (
                  <span
                    key={idx}
                    className="absolute right-2 -translate-y-1/2"
                    style={{ top: `${idx * hourHeight}px` }}
                  >
                    {String(minHour + idx).padStart(2, "0")}:00
                  </span>
                ))}
              </div>

              {/* 7 Columns */}
              {weekDays.map((day) => {
                const dateKey = getDateKey(day);
                const daySlots = slotsByDate[dateKey] ?? [];
                const isToday = new Date().toDateString() === day.toDateString();

                return (
                  <div 
                    key={day.toISOString()} 
                    onDragEnter={(e) => {
                      if (role === "tutor") {
                        setDraggedOverDate(dateKey);
                      }
                    }}
                    onDragLeave={() => {
                      if (role === "tutor") {
                        setDraggedOverDate(null);
                      }
                    }}
                    onDragOver={(e) => {
                      if (role === "tutor") {
                        e.preventDefault();
                      }
                    }}
                    onDrop={async (e) => {
                      if (role !== "tutor") return;
                      e.preventDefault();
                      setDraggedOverDate(null);
                      const slotId = e.dataTransfer.getData("slotId");
                      if (!slotId) return;

                      const rect = e.currentTarget.getBoundingClientRect();
                      const dropY = e.clientY - rect.top;
                      const hourOffset = Math.round(dropY / hourHeight);
                      const targetHour = minHour + hourOffset;

                      handleMoveSlot(slotId, dateKey, targetHour);
                    }}
                    onMouseDown={(e) => handleGridMouseDown(e, dateKey)}
                    onMouseMove={handleGridMouseMove}
                    onMouseUp={handleGridMouseUp}
                    className={cn(
                      "flex-1 border-r border-border/40 last:border-r-0 relative group transition-colors duration-200",
                      isToday && "bg-primary/[0.01]",
                      draggedOverDate === dateKey && "bg-primary/5 border-dashed border-primary"
                    )}
                    style={{ height: `${calendarHeight}px` }}
                  >
                    {/* Hour Lines Grid */}
                    {Array.from({ length: maxHour - minHour }).map((_, idx) => (
                      <div
                        key={idx}
                        className="absolute left-0 right-0 border-t border-border/20 pointer-events-none"
                        style={{ top: `${idx * hourHeight}px`, height: "1px" }}
                      />
                    ))}

                    {/* Visual drag selection preview block */}
                    {dragSelect && dragSelect.dateKey === dateKey && (
                      <div
                        className="absolute left-1 right-1 rounded-xl border-2 border-dashed border-primary bg-primary/10 text-primary-foreground z-10 p-2 flex flex-col justify-between pointer-events-none select-none"
                        style={{
                          top: `${(dragSelect.startHour - minHour) * hourHeight}px`,
                          height: `${(dragSelect.endHour - dragSelect.startHour) * hourHeight}px`
                        }}
                      >
                        <div className="text-[9px] font-bold text-primary flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <span>Creating Open Slot...</span>
                        </div>
                        <div className="text-[10px] font-extrabold text-primary">
                          {String(dragSelect.startHour).padStart(2, "0")}:00 - {String(dragSelect.endHour).padStart(2, "0")}:00
                        </div>
                      </div>
                    )}

                    {/* Today line indicator */}
                    {isToday && (() => {
                      const now = new Date();
                      const currentHours = now.getHours() + now.getMinutes() / 60;
                      if (currentHours >= minHour && currentHours <= maxHour) {
                        return (
                          <div 
                            className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                            style={{ top: `${(currentHours - minHour) * hourHeight}px` }}
                          >
                            <span className="size-2 rounded-full bg-red-500 -ml-1" />
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Slot Blocks */}
                    {daySlots.map((slot) => {
                      const start = new Date(slot.startsAt);
                      const end = new Date(slot.endsAt);
                      const startFraction = start.getHours() + start.getMinutes() / 60;
                      const endFraction = end.getHours() + end.getMinutes() / 60;
                      
                      const topOffset = (startFraction - minHour) * hourHeight;
                      const height = (endFraction - startFraction) * hourHeight;
                      
                      const isPast = start < new Date();
                      const isBooked = slot.isBooked;
                      const mine = isMyBooking(slot);

                      // Decide block styling
                      let blockStyle = "";
                      if (isPast) {
                        blockStyle = "bg-muted/40 border-dashed border-muted-foreground/30 text-muted-foreground cursor-not-allowed";
                      } else if (isBooked) {
                        if (role === "student") {
                          if (mine) {
                            blockStyle = "bg-indigo-600 border border-indigo-700 text-white shadow-sm shadow-indigo-600/10 hover:bg-indigo-700 active:scale-[0.99] cursor-pointer";
                          } else {
                            blockStyle = "bg-muted border border-border text-muted-foreground cursor-not-allowed opacity-60";
                          }
                        } else {
                          blockStyle = "bg-blue-600 border border-blue-700 text-white shadow-sm shadow-blue-600/10 hover:bg-blue-700 active:scale-[0.99] cursor-pointer";
                        }
                      } else {
                        // Open slot
                        blockStyle = "bg-blue-50/70 border border-blue-400/50 text-blue-700 hover:bg-blue-100 hover:border-blue-500 dark:bg-blue-950/20 dark:border-blue-800/40 dark:text-blue-300 dark:hover:bg-blue-900/30 active:scale-[0.99] cursor-pointer";
                      }

                      return (
                        <div
                          key={slot.id}
                          draggable={role === "tutor" && !isPast && !isTouchDevice}
                          onDragStart={(e) => {
                            if (role === "tutor") {
                              e.dataTransfer.setData("slotId", slot.id);
                              e.dataTransfer.effectAllowed = "move";
                              e.currentTarget.style.opacity = "0.5";
                            }
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = "1";
                          }}
                          onClick={() => {
                            if (role === "student" && isPast) return;
                            if (role === "student" && isBooked && !mine) return;
                            handleOpenSlotClick(slot);
                          }}
                          style={{
                            top: `${topOffset}px`,
                            height: `${height}px`,
                          }}
                          className={cn(
                            "absolute left-1 right-1 rounded-xl p-1.5 text-left flex flex-col justify-between overflow-hidden text-[10px] leading-tight transition-all duration-200 z-10 font-bold group/slot",
                            blockStyle
                          )}
                        >
                          <div className="w-full flex items-start justify-between gap-1">
                            <span className="truncate flex items-center gap-1">
                              <Clock className="size-3 shrink-0 opacity-80" />
                              {start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                            </span>

                            {/* Hover Quick Actions (Tutor only) */}
                            {role === "tutor" && !isPast && (
                              <div className="hidden group-hover/slot:flex items-center gap-1 scale-90 z-20">
                                {isBooked ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTutorCancelBooking(slot.booking!.id, true);
                                    }}
                                    className="bg-red-850 text-white hover:bg-red-900 border-none rounded p-0.5 hover:scale-105 transition-all shadow cursor-pointer flex items-center justify-center size-5"
                                    title="Cancel Booking"
                                  >
                                    <X className="size-3" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTutorDeleteSlot(slot.id, true);
                                    }}
                                    className="bg-red-600 text-white hover:bg-red-700 border-none rounded p-0.5 hover:scale-105 transition-all shadow cursor-pointer flex items-center justify-center size-5"
                                    title="Delete Slot"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                )}
                              </div>
                            )}

                            <div className="group-hover/slot:hidden flex gap-1">
                              {role === "student" && mine && (
                                <Badge className="bg-indigo-800 text-white hover:bg-indigo-800 border-none scale-90 -mr-1 px-1 h-3.5 text-[8px] font-black uppercase">
                                  Mine
                                </Badge>
                              )}
                              {role === "student" && isBooked && !mine && (
                                <Badge className="bg-muted-foreground/30 text-muted-foreground hover:bg-muted-foreground/30 border-none scale-90 -mr-1 px-1 h-3.5 text-[8px] font-black uppercase">
                                  Booked
                                </Badge>
                              )}
                              {role === "tutor" && isBooked && (
                                <Badge className="bg-blue-800 text-white hover:bg-blue-800 border-none scale-90 -mr-1 px-1 h-3.5 text-[8px] font-black uppercase">
                                  Booked
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="truncate block font-semibold text-[9px] mt-0.5 opacity-90">
                            {isBooked 
                              ? (role === "student" && !mine ? "Unavailable" : (slot.booking?.studentName || "Lesson")) 
                              : `Open Slot (${getDisplayPrice(tutor.lessonPriceCents)})`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-xl" />
        <div className="h-[400px] w-full bg-card border border-border/80 rounded-2xl" />
      </div>
    );
  }

  const currentWeekDays = selectedWeek === "week1" ? week1Days : week2Days;
  const currentWeekLabel = selectedWeek === "week1" ? "This Week" : "Next Week";

  return (
    <div className="space-y-4">
      {renderWeekGrid(currentWeekDays, currentWeekLabel)}

      {/* SLOT DIALOG MODAL */}
      {selectedSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedSlot(null)}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
              <Badge
                variant={selectedSlot.isBooked ? "default" : "outline"}
                className={cn(
                  "font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5",
                  selectedSlot.isBooked
                    ? (role === "student" && isMyBooking(selectedSlot)
                        ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20"
                        : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/20")
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20"
                )}
              >
                {selectedSlot.isBooked 
                  ? (role === "student" && isMyBooking(selectedSlot) ? "Your Booking" : "Booked Slot") 
                  : "Open Availability Slot"}
              </Badge>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body / Information */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                  <Clock className="size-5 text-primary shrink-0" />
                  {new Date(selectedSlot.startsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  {" – "}
                  {new Date(selectedSlot.endsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold">
                  {new Date(selectedSlot.startsAt).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
              </div>

              {/* TUTOR VIEW MODAL ACTIONS */}
              {role === "tutor" && (
                <div className="space-y-4">
                  {selectedSlot.isBooked ? (
                    /* Booked Slot Tutor Actions */
                    <div className="space-y-4">
                      <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-3.5 space-y-2 text-xs">
                        <p className="font-bold text-foreground">Booking Details:</p>
                        <p className="text-muted-foreground flex items-center gap-1.5">
                          <User className="size-3.5 text-primary" />
                          Student: <strong className="text-foreground">{selectedSlot.booking?.studentName || "GCSE Student"}</strong>
                        </p>
                        <p className="text-muted-foreground">
                          Parent Email: <code className="bg-muted px-1 py-0.5 rounded">{selectedSlot.booking?.parentEmail}</code>
                        </p>
                      </div>

                      {/* Late Notice Form */}
                      <div className="space-y-2 bg-muted/10 border border-border/40 rounded-xl p-3">
                        <label className="text-[11px] font-black uppercase text-muted-foreground block">
                          Running Late Notice
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="e.g. 5-10 minutes"
                            value={lateMessage}
                            className="h-8.5 text-xs rounded-lg"
                            onChange={(e) => setLateMessage(e.target.value)}
                          />
                          <Button
                            type="button"
                            size="xs"
                            className="bg-primary text-white h-8.5 rounded-lg px-3.5"
                            disabled={actionLoading}
                            onClick={() => handleTutorSendLateNotice(selectedSlot.booking!.id)}
                          >
                            Send
                          </Button>
                        </div>
                      </div>

                      {/* Other Buttons */}
                      <div className="flex flex-col gap-2 pt-2">
                        {/* Send 24h Reminder */}
                        {(() => {
                          const hoursUntil = (new Date(selectedSlot.startsAt).getTime() - Date.now()) / (1000 * 60 * 60);
                          const isWithin24Hours = hoursUntil <= 24 && hoursUntil > 0;
                          const isReminderSent = !!selectedSlot.booking?.lessonReminderSentAt;

                          if (hoursUntil <= 0) return null;

                          return (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl w-full text-xs font-bold gap-1.5 h-10 border-border"
                              disabled={isReminderSent || !isWithin24Hours || actionLoading}
                              onClick={() => handleTutorSendReminder(selectedSlot.booking!.id)}
                            >
                              <Bell className="size-4" />
                              {isReminderSent ? "✓ Reminder Already Sent" : "Send 24h Reminder"}
                            </Button>
                          );
                        })()}

                        {/* Cancel Booking */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl w-full text-xs font-bold gap-1.5 h-10 border-destructive text-destructive hover:bg-destructive/5"
                          disabled={actionLoading}
                          onClick={() => handleTutorCancelBooking(selectedSlot.booking!.id)}
                        >
                          <X className="size-4" />
                          Cancel Lesson Booking
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Open Slot Tutor Actions */
                    <div className="space-y-4">
                      {/* Manual Booking Form */}
                      <div className="bg-muted/15 border border-border/40 rounded-xl p-3.5 space-y-3">
                        <span className="text-[11px] font-black uppercase text-muted-foreground block">
                          Book Open Slot Manually
                        </span>
                        <div className="space-y-2">
                          <Input
                            type="email"
                            placeholder="parent@example.com"
                            value={manualParentEmail}
                            className="h-9.5 text-xs rounded-xl"
                            onChange={(e) => setManualParentEmail(e.target.value)}
                          />
                          <Input
                            type="text"
                            placeholder="Student Name (optional)"
                            value={manualStudentName}
                            className="h-9.5 text-xs rounded-xl"
                            onChange={(e) => setManualStudentName(e.target.value)}
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="w-full bg-primary text-white font-bold h-9.5 rounded-xl mt-1"
                            disabled={actionLoading}
                            onClick={() => handleTutorManualBook(selectedSlot.id)}
                          >
                            {actionLoading ? "Booking..." : "Book Slot"}
                          </Button>
                        </div>
                      </div>

                      {/* Delete Slot Availability */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl w-full text-xs font-bold gap-1.5 h-10 border-destructive text-destructive hover:bg-destructive/5"
                        disabled={actionLoading}
                        onClick={() => handleTutorDeleteSlot(selectedSlot.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete Open Availability Slot
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* STUDENT VIEW MODAL ACTIONS */}
              {role === "student" && (
                <div className="space-y-4">
                  {selectedSlot.isBooked ? (
                    /* Booked Slot Student Action (Only if they own it) */
                    (selectedSlot.booking?.parentEmail.toLowerCase() === parentEmail.toLowerCase() ? (
                      <div className="space-y-4">
                        <div className="bg-indigo-50/20 border border-indigo-100/50 rounded-xl p-3.5 space-y-1.5 text-xs">
                          <p className="font-bold text-foreground">Your Lesson with {tutor.displayName}</p>
                          <p className="text-muted-foreground">
                            Status: <strong className="text-emerald-600 font-bold uppercase">{selectedSlot.booking?.status}</strong>
                          </p>
                          {selectedSlot.booking?.runningLateNote && (
                            <p className="text-amber-600 bg-amber-50/50 border border-amber-100 rounded-lg p-2 mt-2 font-medium">
                              ⚠️ Tutor Late Notice: &ldquo;{selectedSlot.booking.runningLateNote}&rdquo;
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl w-full text-xs font-bold gap-1.5 h-10 border-destructive text-destructive hover:bg-destructive/5"
                          disabled={actionLoading}
                          onClick={() => handleStudentCancelBooking(selectedSlot.booking!.id)}
                        >
                          <X className="size-4" />
                          Cancel Lesson Booking
                        </Button>
                      </div>
                    ) : null)
                  ) : (
                    /* Open Slot Student Action (Book Lesson) */
                    <div className="space-y-4">
                      <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-3.5 space-y-1.5 text-xs">
                        <p className="font-bold text-foreground flex items-center justify-between">
                          <span>Lesson Price:</span>
                          <strong className="text-primary text-sm font-black">
                            {getDisplayPrice(tutor.lessonPriceCents)}
                          </strong>
                        </p>
                        <p className="text-muted-foreground">
                          Duration: 60 minutes
                        </p>
                      </div>

                      {/* Student details */}
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black uppercase text-muted-foreground">
                            Student Name
                          </label>
                          <Input
                            type="text"
                            placeholder="Student's Name"
                            value={manualStudentName}
                            required
                            className="h-9.5 text-xs rounded-xl"
                            onChange={(e) => setManualStudentName(e.target.value)}
                          />
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-black uppercase text-muted-foreground">
                            Payment Method
                          </label>
                          <div className="grid gap-2">
                             {/* Credits Option */}
                             {(() => {
                               const canUseCredit = !(creditLimit ?? 0) || (studentCredits ?? 0) - 1 >= -(creditLimit ?? 0);
                               return (
                                 <button
                                   type="button"
                                   disabled={!canUseCredit}
                                   className={cn(
                                     "flex items-center justify-between p-3.5 border rounded-xl text-left transition-all duration-200 cursor-pointer text-xs font-bold",
                                     paymentMethod === "credit"
                                       ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30"
                                       : "border-border bg-card hover:bg-muted/50 text-foreground",
                                     !canUseCredit && "opacity-50 cursor-not-allowed hover:bg-transparent"
                                   )}
                                   onClick={() => setPaymentMethod("credit")}
                                 >
                                   <span className="flex items-center gap-2">
                                     <Coins className="size-4 text-primary" />
                                     <span>
                                       {studentCredits > 0
                                         ? `Book using Prepaid Credits (${studentCredits} left)`
                                         : `Book on Account (Balance: ${Math.abs(studentCredits ?? 0)} unpaid lesson${Math.abs(studentCredits ?? 0) === 1 ? "" : "s"})`}
                                     </span>
                                   </span>
                                   {!canUseCredit && (
                                     <span className="text-[10px] text-muted-foreground font-medium">
                                       Limit Exceeded
                                     </span>
                                   )}
                                 </button>
                               );
                             })()}

                            {/* Card Option */}
                            {paymentsEnabled && (
                              <button
                                type="button"
                                className={cn(
                                  "flex items-center justify-between p-3.5 border rounded-xl text-left transition-all duration-200 cursor-pointer text-xs font-bold",
                                  paymentMethod === "card"
                                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30"
                                    : "border-border bg-card hover:bg-muted/50 text-foreground"
                                )}
                                onClick={() => setPaymentMethod("card")}
                              >
                                <span className="flex items-center gap-2">
                                  <CreditCard className="size-4 text-primary" />
                                  <span>Pay with Debit/Credit Card</span>
                                </span>
                              </button>
                            )}

                            {/* Cash Option */}
                            {tutor.allowCashPayments !== false && (
                              <button
                                type="button"
                                className={cn(
                                  "flex items-center justify-between p-3.5 border rounded-xl text-left transition-all duration-200 cursor-pointer text-xs font-bold",
                                  paymentMethod === "cash"
                                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30"
                                    : "border-border bg-card hover:bg-muted/50 text-foreground"
                                )}
                                onClick={() => setPaymentMethod("cash")}
                              >
                                <span className="flex items-center gap-2">
                                  <Coins className="size-4 text-primary" />
                                  <span>Pay Cash / Bank Direct</span>
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="button"
                          className="w-full bg-primary text-white font-black h-10 rounded-xl mt-2"
                          disabled={actionLoading || !manualStudentName.trim()}
                          onClick={() => handleStudentBookSlot(selectedSlot)}
                        >
                          {actionLoading 
                            ? "Booking Lesson..." 
                            : (paymentMethod === "card" ? "Pay & Book Lesson" : "Confirm Booking")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Notifications */}
              {errorMsg && (
                <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-xs font-semibold text-destructive flex items-center gap-1.5 mt-2">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mt-2">
                  <Check className="size-3.5 shrink-0" />
                  {successMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
