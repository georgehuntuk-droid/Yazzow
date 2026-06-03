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
      <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-4">
        <Users className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-medium text-foreground">
            You&apos;re connected with {tutor.displayName}
          </p>
          <p className="mt-1 text-muted-foreground">
            {joined.studentName} · {joined.parentEmail}. Book below or wait for slot alerts
            when times open up.
          </p>
        </div>
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
