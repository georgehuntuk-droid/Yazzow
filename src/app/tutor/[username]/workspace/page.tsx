import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, CalendarRange, CheckCircle2, Circle, GraduationCap, ArrowLeft, LogOut, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/constants";
import { InstallAppButton } from "@/components/pwa/install-app-button";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTutorByUsername } from "@/lib/tutors/queries";
import { getDemoTutorByUsername } from "@/lib/demo-data";
import { PortalThemeWrapper } from "@/components/tutor/portal-theme-wrapper";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceClient } from "./workspace-client";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { WorkspaceChat } from "@/components/booking/workspace-chat";
import { formatMoney, formatSlotRange } from "@/lib/format";

type WorkspacePageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ studentId?: string }>;
};

const DEMO_USERNAMES = new Set(["demo", "maya-chen"]);

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const isDemo = DEMO_USERNAMES.has(username);
  const tutor = isDemo ? getDemoTutorByUsername(username) : await getTutorByUsername(username);

  return {
    title: tutor ? `Student Workspace · ${tutor.displayName} · ${BRAND_NAME}` : `Student Workspace · ${BRAND_NAME}`,
    robots: { index: false, follow: false },
  };
}

export default async function StudentWorkspacePage({ params, searchParams }: WorkspacePageProps) {
  const { username } = await params;
  const { studentId } = await searchParams;

  const isDemo = DEMO_USERNAMES.has(username);
  const tutor = isDemo
    ? getDemoTutorByUsername(username)
    : await getTutorByUsername(username);

  if (!tutor) {
    notFound();
  }

  // 1. Get the current user session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect(`/auth/login?next=/tutor/${username}/workspace`);
  }

  // 2. Check student records via Admin Client to bypass RLS (since students can't read profiles of other students)
  const admin = createAdminClient();
  const { data: studentRecords } = await admin
    .from("students")
    .select("*")
    .eq("tutor_id", tutor.id)
    .eq("parent_email", user.email)
    .eq("status", "active");

  if (!studentRecords || studentRecords.length === 0) {
    if (tutor.allowPublicJoining !== false) {
      return (
        <PortalThemeWrapper tutor={tutor}>
          <CreateWorkspaceForm
            tutor={tutor}
            tutorUsername={username}
            parentEmail={user.email}
          />
        </PortalThemeWrapper>
      );
    }

    // Student not registered or archived/removed
    return (
      <PortalThemeWrapper tutor={tutor}>
        <div className="min-h-screen flex flex-col bg-background">
          <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
            <div className="yazz-container flex h-16 max-w-5xl items-center justify-between gap-4">
              <Logo size="header" href="/" />
              <Link href={`/tutor/${username}`} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" /> Back to Portal
              </Link>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm">
              <GraduationCap className="mx-auto size-12 text-muted-foreground/80" />
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Access Denied</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You are not currently enrolled as an active student with <strong className="text-foreground">{tutor.displayName}</strong>.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Please ask your tutor to add your email (<code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">{user.email}</code>) to their student directory.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2.5">
                <Link href={`/tutor/${username}`} className="w-full inline-flex justify-center rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-95 transition-opacity">
                  Back to Portal
                </Link>
                <form action="/auth/signout" method="post" className="w-full">
                  <button type="submit" className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </main>
        </div>
      </PortalThemeWrapper>
    );
  }

  // If there are multiple active children and no studentId is selected in the URL (or is invalid), show student selection screen
  let studentRecord = studentRecords.find((s) => s.id === studentId);
  
  if (studentRecords.length > 1 && !studentRecord) {
    return (
      <PortalThemeWrapper tutor={tutor}>
        <div className="min-h-screen flex flex-col bg-background">
          <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
            <div className="yazz-container flex h-16 max-w-5xl items-center justify-between gap-4">
              <Logo size="header" href="/" />
              <Link href={`/tutor/${username}`} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" /> Back to Portal
              </Link>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
                <GraduationCap className="size-6 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Select Student Workspace</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We found multiple student profiles registered under your email (<code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">{user.email}</code>). Which workspace would you like to open?
                </p>
              </div>
              <div className="space-y-2.5 pt-2">
                {studentRecords.map((student) => (
                  <Link
                    key={student.id}
                    href={`/tutor/${username}/workspace?studentId=${student.id}`}
                    className="w-full inline-flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 hover:bg-muted/40 hover:border-primary/40 hover:scale-[1.01] transition-all duration-200 font-semibold text-foreground text-sm shadow-sm"
                  >
                    <span>{student.student_name}</span>
                    <span className="text-xs text-primary font-bold">Open Workspace →</span>
                  </Link>
                ))}
              </div>
              <div className="pt-2">
                <form action="/auth/signout" method="post" className="w-full">
                  <button type="submit" className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </main>
        </div>
      </PortalThemeWrapper>
    );
  }

  // If only 1 student exists and no studentId is in query, use the only student
  if (!studentRecord) {
    studentRecord = studentRecords[0];
  }

  // 3. Fetch lessons and tasks for this student
  const [{ data: rawBookings }, { data: rawTasks }] = await Promise.all([
    admin
      .from("bookings")
      .select("id, status, amount_cents, created_at, tutor_lesson_feedback, lesson_rating, availability_slots (starts_at, ends_at)")
      .eq("tutor_id", tutor.id)
      .eq("parent_email", user.email)
      .order("created_at", { ascending: false }),
    admin
      .from("student_tasks")
      .select("*")
      .eq("student_id", studentRecord.id)
      .order("created_at", { ascending: false }),
  ]);

  const bookings = (rawBookings ?? []).map((b) => {
    const slot = Array.isArray(b.availability_slots) ? b.availability_slots[0] : b.availability_slots;
    return {
      id: b.id,
      startsAt: slot?.starts_at || b.created_at,
      endsAt: slot?.ends_at || b.created_at,
      status: b.status,
      amountCents: b.amount_cents,
      feedback: b.tutor_lesson_feedback,
      rating: b.lesson_rating,
    };
  });

  const now = new Date();
  const upcomingLessons = bookings.filter((b) => b.status === "confirmed" && new Date(b.startsAt) > now);
  const pastLessons = bookings.filter((b) => new Date(b.startsAt) <= now || b.status === "cancelled");

  const tasks = (rawTasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status as "pending" | "completed",
    feedback: t.tutor_feedback,
    createdAt: t.created_at,
    completedAt: t.completed_at,
  }));

  return (
    <PortalThemeWrapper tutor={tutor}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Navigation Header */}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="yazz-container flex h-16 max-w-5xl items-center justify-between gap-4">
            <Logo size="header" href="/" />
            <div className="flex items-center gap-3">
              {studentRecords.length > 1 && (
                <Link
                  href={`/tutor/${username}/workspace`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline transition-colors mr-1"
                >
                  ⇄ Switch Student
                </Link>
              )}
              <span className="hidden sm:inline-block text-xs font-semibold text-muted-foreground bg-muted/70 px-2.5 py-1 rounded-lg">
                Student: {studentRecord.student_name}
              </span>
              <InstallAppButton size="sm" variant="outline" className="hidden sm:inline-flex" />
              <form action="/auth/signout" method="post">
                <button type="submit" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors py-1.5 px-3 rounded-lg border border-border hover:bg-destructive/5">
                  <LogOut className="size-3.5" /> Sign Out
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="yazz-container max-w-5xl flex-1 py-8 sm:py-10 space-y-8">
          {/* Welcome banner */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/5 to-transparent p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
              <div className="space-y-1">
                <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                  Welcome to your workspace, {studentRecord.student_name}!
                  <Sparkles className="size-5 text-primary animate-pulse" />
                </h1>
                <p className="text-sm font-semibold text-muted-foreground">
                  Your classroom portal for 1-on-1 tutoring with <strong className="text-foreground font-bold">{tutor.displayName}</strong>.
                </p>
              </div>
              <Link href={`/tutor/${username}`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-4 text-xs font-bold shadow-sm hover:bg-muted transition-colors">
                <ArrowLeft className="size-3.5" /> Book a Lesson
              </Link>
            </div>
          </div>

          {/* Stats matrix / info card */}
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="yazz-surface">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lesson Credits</p>
                  <p className="text-2xl font-black text-foreground mt-0.5">{studentRecord.lesson_credits}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="yazz-surface">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                  <CalendarRange className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Lessons</p>
                  <p className="text-2xl font-black text-foreground mt-0.5">{upcomingLessons.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="yazz-surface">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Tasks</p>
                  <p className="text-2xl font-black text-foreground mt-0.5">
                    {tasks.filter((t) => t.status === "completed").length} / {tasks.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Layout Grid */}
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Task Board */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-foreground">Homework & Tasks</h2>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {tasks.filter((t) => t.status === "pending").length} active
                </Badge>
              </div>

              <WorkspaceClient initialTasks={tasks} />
            </section>

            {/* Sidebar with lessons & past feedback */}
            <div className="space-y-6">
              <WorkspaceChat tutorId={tutor.id} tutorDisplayName={tutor.displayName} />

              {/* Upcoming schedule */}
              <section className="space-y-3">
                <h3 className="font-heading text-base font-bold text-foreground">Upcoming Schedule</h3>
                {upcomingLessons.length === 0 ? (
                  <div className="yazz-panel px-4 py-8 text-center text-xs text-muted-foreground italic">
                    No upcoming lessons booked.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingLessons.map((lesson) => (
                      <div key={lesson.id} className="rounded-xl border border-border bg-card p-3 text-sm flex justify-between items-center">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">1-on-1 Lesson</p>
                          <p className="text-xs text-muted-foreground">
                            {formatSlotRange(lesson.startsAt, lesson.endsAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Booked
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Past feedback */}
              <section className="space-y-3">
                <h3 className="font-heading text-base font-bold text-foreground">Past Lesson Feedback</h3>
                {pastLessons.filter((b) => b.feedback || b.rating).length === 0 ? (
                  <div className="yazz-panel px-4 py-8 text-center text-xs text-muted-foreground italic">
                    No lesson feedback available yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pastLessons
                      .filter((b) => b.feedback || b.rating)
                      .map((lesson) => (
                        <div key={lesson.id} className="rounded-xl border border-border bg-card p-3 text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-muted-foreground">
                              {new Date(lesson.startsAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            {lesson.rating && (
                              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                                ★ {lesson.rating}/5
                              </div>
                            )}
                          </div>
                          {lesson.feedback && (
                            <p className="text-foreground leading-normal italic bg-muted/30 p-2.5 rounded-lg border border-border/40">
                              &ldquo;{lesson.feedback}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </PortalThemeWrapper>
  );
}
