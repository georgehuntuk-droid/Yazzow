"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TutorProfile } from "@/lib/types";

type JoinTutorFamilyProps = {
  tutor: TutorProfile;
  tutorUsername: string;
};

type StoredFamily = {
  parentEmail: string;
  studentName: string;
};

function storageKey(username: string) {
  return `yazzow-family:${username}`;
}

export function JoinTutorFamily({ tutor, tutorUsername }: JoinTutorFamilyProps) {
  const [parentEmail, setParentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [joined, setJoined] = useState<StoredFamily | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(tutorUsername));
      if (raw) {
        setJoined(JSON.parse(raw) as StoredFamily);
      }
    } catch {
      // ignore
    }
  }, [tutorUsername]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tutor/${tutorUsername}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentEmail, studentName }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not join.");
        return;
      }

      const record: StoredFamily = {
        parentEmail: parentEmail.trim().toLowerCase(),
        studentName: studentName.trim(),
      };
      localStorage.setItem(storageKey(tutorUsername), JSON.stringify(record));
      setJoined(record);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (joined) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-5 shadow-sm shadow-blue-500/5">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 size-4 shrink-0 text-primary animate-pulse" />
          <div className="text-sm">
            <p className="font-bold text-foreground">
              You&apos;re connected with {tutor.displayName}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground leading-normal">
              {joined.studentName} · {joined.parentEmail}
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              Ready to book below or wait for instant slot alerts.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="rounded-lg text-xs font-bold shrink-0 self-start sm:self-auto hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20"
          onClick={() => {
            if (confirm("Disconnect and change your student details?")) {
              localStorage.removeItem(storageKey(tutorUsername));
              setJoined(null);
              setParentEmail(joined.parentEmail);
              setStudentName(joined.studentName);
            }
          }}
        >
          Change Details
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent px-4 py-5 sm:px-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <Users className="size-5 text-primary" />
        <h2 className="font-heading text-lg font-semibold">
          Join {tutor.displayName}&apos;s families
        </h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        One quick step so {tutor.displayName} knows who you are. You&apos;ll be on their
        student list for bookings, updates, and when slots become available — no Yazzow
        account needed.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="join-parent-email" className="text-sm font-medium">
            Parent email
          </label>
          <Input
            id="join-parent-email"
            type="email"
            required
            placeholder="you@family.com"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="join-student-name" className="text-sm font-medium">
            Student name
          </label>
          <Input
            id="join-student-name"
            required
            placeholder="Alex Smith"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="mt-4" disabled={loading}>
        {loading ? "Joining…" : `Join ${tutor.displayName}'s group`}
      </Button>
    </form>
  );
}
