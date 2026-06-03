"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SlotAlertSignupProps = {
  tutorUsername: string;
};

export function SlotAlertSignup({ tutorUsername }: SlotAlertSignupProps) {
  const [email, setEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tutor/${tutorUsername}/slot-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentEmail: email,
          studentName: studentName || undefined,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not subscribe.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
        <Bell className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          You&apos;ll be emailed when a lesson slot opens (including when another family
          cancels). Keep this page open for instant updates too.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border/70 bg-muted/20 px-4 py-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <Bell className="size-4 text-primary" />
        <p className="text-sm font-medium">Get notified when a slot opens</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Join this tutor&apos;s alert list — we&apos;ll email your family when a cancelled or
        new hour becomes available.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="email"
          required
          placeholder="Parent email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Student name (optional)"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" variant="outline" size="sm" className="mt-3" disabled={loading}>
        {loading ? "Saving…" : "Notify me"}
      </Button>
    </form>
  );
}
