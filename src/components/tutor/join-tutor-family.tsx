"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, LogIn, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TutorProfile } from "@/lib/types";

type JoinTutorFamilyProps = {
  tutor: TutorProfile;
  tutorUsername: string;
  currentUserEmail?: string;
  connectedStudents?: { studentName: string; parentEmail: string }[];
};

export function JoinTutorFamily({
  tutor,
  tutorUsername,
  currentUserEmail,
  connectedStudents = [],
}: JoinTutorFamilyProps) {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!currentUserEmail) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tutor/${tutorUsername}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentEmail: currentUserEmail,
          studentName,
          parentPhone,
        }),
      });
      
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not connect to tutor.");
        return;
      }

      setStudentName("");
      // Refresh router so server component fetches new student record and renders the workspace launcher
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // 1. Parent is already connected to student(s) with this tutor
  if (connectedStudents.length > 0) {
    const studentNames = connectedStudents.map((s) => s.studentName).join(", ");
    return (
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
              <Users className="size-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Connected with {tutor.displayName}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Active account for: <strong className="text-foreground font-semibold">{studentNames}</strong>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Linked email: <code className="bg-muted px-1 py-0.2 rounded font-mono">{currentUserEmail}</code>
              </p>
            </div>
          </div>
          <Link href={`/tutor/${tutorUsername}/workspace`} className="shrink-0 self-start sm:self-auto w-full sm:w-auto">
            <Button className="w-full sm:w-auto font-bold flex items-center gap-2 cursor-pointer shadow-sm">
              Open Student Workspace
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Parent is NOT logged in (Guest) - Redirect to secure Auth Pages
  if (!currentUserEmail) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 sm:p-6 text-center space-y-4 shadow-sm">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
          <Users className="size-5" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Access Portal & Workspace
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Log in or sign up to access your lessons, homework assignments, test credits, and chat directly with {tutor.displayName}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-xs mx-auto pt-1">
          <Link href={`/auth/login?next=/tutor/${tutorUsername}/workspace`} className="w-full sm:w-auto flex-1">
            <Button size="sm" className="w-full font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <LogIn className="size-4" />
              Sign In
            </Button>
          </Link>
          <Link href={`/auth/signup?next=/tutor/${tutorUsername}/workspace`} className="w-full sm:w-auto flex-1">
            <Button size="sm" variant="outline" className="w-full font-bold cursor-pointer">
              Register Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Parent is logged in but has no student profiles registered yet with this tutor
  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 sm:p-6 shadow-sm space-y-4"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Users className="size-5" />
        </div>
        <h2 className="font-heading text-base font-semibold text-foreground">
          Join {tutor.displayName}&apos;s Group
        </h2>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
        You are logged in as <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">{currentUserEmail}</code>. Enter your name below to link and activate your student workspace.
      </p>

      <div className="grid gap-3 sm:grid-cols-3 max-w-2xl">
        <div className="space-y-1.5">
          <label htmlFor="join-student-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Student Name
          </label>
          <Input
            id="join-student-name"
            required
            placeholder="Alex Smith"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Email Address
          </label>
          <Input
            type="email"
            disabled
            value={currentUserEmail}
            className="opacity-75 bg-muted/30"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="join-parent-phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Mobile Number (for SMS alerts)
          </label>
          <Input
            id="join-parent-phone"
            type="tel"
            placeholder="+37122416643"
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
          />
        </div>
      </div>

      {error ? <p className="text-xs text-destructive font-medium">{error}</p> : null}

      <div className="pt-1">
        <Button type="submit" disabled={loading} className="font-bold cursor-pointer">
          {loading ? "Joining..." : `Connect with ${tutor.displayName}`}
        </Button>
      </div>
    </form>
  );
}
