"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import type { TutorProfile } from "@/lib/types";

type CreateWorkspaceFormProps = {
  tutor: TutorProfile;
  tutorUsername: string;
  parentEmail: string;
};

export function CreateWorkspaceForm({
  tutor,
  tutorUsername,
  parentEmail,
}: CreateWorkspaceFormProps) {
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tutor/${tutorUsername}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentEmail,
          studentName,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Failed to activate workspace.");
        return;
      }

      // Reload page to run server components check again with the newly created student row
      window.location.reload();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="yazz-container flex h-16 max-w-5xl items-center justify-between gap-4">
          <Logo size="header" href="/" />
          <Link
            href={`/tutor/${tutorUsername}`}
            className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to Portal
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
            <GraduationCap className="size-6 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Activate Workspace</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Log in succeeded! Enter your child&apos;s name below to register their profile and activate your workspace with <strong className="text-foreground">{tutor.displayName}</strong>.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="text-left space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="workspace-student-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Student Name
              </label>
              <Input
                id="workspace-student-name"
                required
                placeholder="Alex Smith"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Parent Email
              </label>
              <Input
                type="email"
                disabled
                value={parentEmail}
                className="opacity-75 bg-muted/30"
              />
            </div>
            
            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
            
            <div className="pt-2">
              <Button type="submit" disabled={loading} className="w-full font-bold cursor-pointer">
                {loading ? "Activating..." : "Activate Workspace"}
              </Button>
            </div>
          </form>

          <div className="pt-1">
            <form action="/auth/signout" method="post" className="w-full">
              <button type="submit" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 cursor-pointer">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
