"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, Calendar, BookOpen, User, Mail, Sparkles, Loader2 } from "lucide-react";
import { claimSlotAction } from "./actions";

type ClaimFormProps = {
  token: string;
  tutorName: string;
  formattedTime: string;
  subject: string;
  level: string;
};

export function ClaimForm({ token, tutorName, formattedTime, subject, level }: ClaimFormProps) {
  const [parentEmail, setParentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "already_claimed" | "not_registered" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parentEmail || !studentName) return;

    setLoading(true);
    setStatus("idle");

    try {
      const res = await claimSlotAction(token, parentEmail, studentName);
      if (res.ok) {
        setStatus("success");
      } else {
        if (res.error === "already_claimed") {
          setStatus("already_claimed");
        } else if (res.error === "student_not_registered") {
          setStatus("not_registered");
        } else {
          setStatus("error");
        }
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  if (status === "success") {
    return (
      <div className="text-center p-8 space-y-4">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
          <CheckCircle2 className="size-10" />
        </div>
        <h2 className="font-heading text-2xl font-black text-foreground">Lesson Slot Secured!</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Success! The lesson slot with <strong>{tutorName}</strong> has been successfully booked for <strong>{studentName}</strong>. 
          A confirmation email has been sent.
        </p>
        <div className="pt-4">
          <a
            href="/auth/login"
            className="yazz-btn-primary inline-flex h-10 items-center justify-center px-6 text-sm font-semibold"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (status === "already_claimed") {
    return (
      <div className="text-center p-8 space-y-4">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-amber-500/10 text-amber-600 mb-2">
          <AlertTriangle className="size-10" />
        </div>
        <h2 className="font-heading text-2xl font-black text-foreground">Already Claimed</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          This slot has already been claimed! Another parent clicked the link and confirmed their booking before you. 
          Please contact <strong>{tutorName}</strong> directly if you need to schedule another time.
        </p>
        <div className="pt-4">
          <a
            href="/"
            className="yazz-btn-secondary inline-flex h-10 items-center justify-center px-6 text-sm font-semibold"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-2">
      <div className="bg-muted/40 border border-border/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2.5 text-sm text-foreground font-semibold">
          <Calendar className="size-4.5 text-primary shrink-0" />
          <span>{formattedTime}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <BookOpen className="size-4.5 text-primary shrink-0" />
          <span>{level} {subject}</span>
        </div>
      </div>

      {status === "not_registered" && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex gap-2">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <p>
            No student profile matching those details was found for this tutor. Please check the spelling or contact your tutor.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex gap-2">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <p>An unexpected error occurred. Please refresh and try again.</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Parent Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              required
              disabled={loading}
              placeholder="parent@example.com"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="student" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Student Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              id="student"
              type="text"
              required
              disabled={loading}
              placeholder="Maya Chen"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !parentEmail || !studentName}
        className="w-full yazz-btn-primary h-11 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Securing Slot...
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Confirm & Claim Slot
          </>
        )}
      </button>
    </form>
  );
}
