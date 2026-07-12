"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, CheckCircle, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type AcademyBookingFormProps = {
  academy: any;
  tutors: any[];
  slots: any[];
};

const SUBJECT_OPTIONS = [
  "GCSE Maths",
  "GCSE English",
  "GCSE Physics",
  "GCSE Chemistry",
  "GCSE Biology",
  "A-Level Maths",
  "A-Level Physics",
  "KS3 Science",
  "Other Subject"
];

export function AcademyBookingForm({ academy, tutors, slots }: AcademyBookingFormProps) {
  const [step, setStep] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  
  // Form details
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [studentName, setStudentName] = useState("");

  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Group slots by date
  const availableSlots = slots.filter((slot) => {
    if (!slot.starts_at) return false;
    const dateStr = new Date(slot.starts_at).toISOString().split("T")[0];
    if (selectedDate && dateStr !== selectedDate) return false;
    return true;
  });

  const getTutorDetails = (tutorId: string) => {
    return tutors.find((t) => t.id === tutorId) || {
      displayName: "Academy Tutor",
      headline: "Professional Instructor",
      lessonPriceCents: 4500
    };
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await fetch("/api/tutor/book-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          tutorId: selectedSlot.tutor_id,
          parentEmail: parentEmail.trim().toLowerCase(),
          parentPhone: parentPhone.trim(),
          studentName: studentName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to finalize booking.");
      }

      setStep(4);
    } catch (err: any) {
      setBookingError(err.message || "An unexpected booking error occurred.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Get unique dates that have slots available
  const uniqueDates = Array.from(
    new Set(
      slots.map((s) => new Date(s.starts_at).toISOString().split("T")[0])
    )
  ).sort();

  return (
    <div className="max-w-2xl mx-auto yazz-panel p-6 sm:p-8 space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
        <span className={step === 1 ? "text-primary font-black" : ""}>1. Subject & Date</span>
        <span>→</span>
        <span className={step === 2 ? "text-primary font-black" : ""}>2. Match Slots</span>
        <span>→</span>
        <span className={step === 3 ? "text-primary font-black" : ""}>3. Your Details</span>
        <span>→</span>
        <span className={step === 4 ? "text-emerald-500 font-black" : ""}>4. Done</span>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">1. Select Target Subject</label>
            <div className="grid grid-cols-2 gap-2.5">
              {SUBJECT_OPTIONS.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(sub)}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                    selectedSubject === sub
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/80 hover:bg-muted/40 text-foreground"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">2. Preferred Date</label>
            {uniqueDates.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">No open slots currently scheduled by staff.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {uniqueDates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                      selectedDate === date
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/80 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              disabled={!selectedSubject || !selectedDate}
              onClick={() => setStep(2)}
              className="h-10 px-5 font-bold text-xs"
            >
              Find Available Tutors
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Available Slots matching {selectedSubject}</h3>
            <p className="text-xs text-muted-foreground">Select a slot to view matched staff tutor credentials.</p>
          </div>

          {availableSlots.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center italic">No tutors are free on this date.</p>
          ) : (
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {availableSlots.map((slot) => {
                const tutor = getTutorDetails(slot.tutor_id);
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      selectedSlot?.id === slot.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/5 border border-border/80 flex items-center justify-center shrink-0 text-primary font-bold overflow-hidden">
                        {tutor.avatarUrl ? (
                          <img src={tutor.avatarUrl} alt={tutor.displayName} className="size-full object-cover" />
                        ) : (
                          tutor.displayName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-foreground">{tutor.displayName}</span>
                          <Badge variant="outline" className="text-[8px] px-1 py-0 uppercase">Staff</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{tutor.headline}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                        <Clock className="size-3.5 text-primary" />
                        {new Date(slot.starts_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} - {new Date(slot.ends_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <span className="font-bold text-xs text-primary shrink-0">
                        £{(tutor.lessonPriceCents / 100).toFixed(2)}/hr
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="h-10 text-xs">
              Back
            </Button>
            <Button
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className="h-10 px-5 font-bold text-xs"
            >
              Continue to Details
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Complete Your Booking</h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Enter your parent email and student details below. An invitation to access the parent portal will be emailed instantly.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Parent Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  required
                  placeholder="John Doe"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Parent Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  placeholder="parent@example.com"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Parent Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="tel"
                  required
                  placeholder="+44 7123 456789"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Student Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  required
                  placeholder="Tom Doe"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>
          </div>

          {bookingError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex items-start gap-2.5 text-xs text-destructive font-semibold">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              {bookingError}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="h-10 text-xs">
              Back
            </Button>
            <Button
              disabled={bookingLoading || !parentName || !parentEmail || !studentName}
              onClick={handleBook}
              className="h-10 px-6 font-bold text-xs"
            >
              Confirm Lesson Booking
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto">
          <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center animate-bounce">
            <CheckCircle className="size-10" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-foreground">Booking Confirmed!</h2>
            <p className="text-xs text-muted-foreground leading-normal">
              Your lesson request has been registered. The assigned tutor and academy owner have been notified. Check your email for login details to your Parent Dashboard.
            </p>
          </div>
          <Button
            onClick={() => {
              setStep(1);
              setSelectedSlot(null);
            }}
            className="w-full h-10 font-bold text-xs rounded-xl"
          >
            Book Another Lesson
          </Button>
        </div>
      )}
    </div>
  );
}
