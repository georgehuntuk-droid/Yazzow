import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { BookOpen, CalendarRange, CheckCircle2, Circle, GraduationCap, ArrowLeft, LogOut, Sparkles, ChevronDown, HelpCircle, Clock } from "lucide-react";
import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/constants";
import { InstallAppButton } from "@/components/pwa/install-app-button";

import { createClient, safeGetAuthUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTutorByUsername } from "@/lib/tutors/queries";
import { getDemoTutorByUsername } from "@/lib/demo-data";
import { PortalThemeWrapper } from "@/components/tutor/portal-theme-wrapper";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PushSubscriptionToggle } from "@/components/pwa/push-subscription-toggle";
import { PushNotificationBanner } from "@/components/pwa/push-notification-banner";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { getPortalBookingStatus } from "@/lib/tutors/portal-booking-status";
import { WorkspaceDashboard } from "./workspace-dashboard";

type WorkspacePageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ studentId?: string; parentEmail?: string }>;
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
  const [tutor, user] = await Promise.all([
    isDemo ? Promise.resolve(getDemoTutorByUsername(username)) : getTutorByUsername(username),
    safeGetAuthUser(),
  ]);

  if (!tutor || tutor.isBanned) {
    notFound();
  }

  if (!user || !user.email) {
    redirect(`/auth/login?next=/tutor/${username}/workspace`);
  }

  // If the logged-in user is the tutor of this workspace, redirect them to the tutor dashboard messages thread
  const { getTutorProfileForUser } = await import("@/lib/tutors/queries");
  const userTutorProfile = await getTutorProfileForUser(user.id);
  if (userTutorProfile && userTutorProfile.id === tutor.id) {
    const { parentEmail } = await searchParams;
    if (parentEmail) {
      redirect(`/dashboard/messages?email=${encodeURIComponent(parentEmail)}`);
    }
    redirect(`/dashboard/messages`);
  }

  // 2. Check student records via Admin Client to bypass RLS (since students can't read profiles of other students)
  const admin = createAdminClient();
  let studentRecords;
  let allStudentRecords;
  let otherTutors: { username: string; display_name: string }[] = [];

  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;

  if (testVal === "dashboard") {
    studentRecords = [{
      id: "student-mock-1",
      student_name: "Bobby",
      parent_email: "testparent@example.com",
      lesson_credits: 4,
      credit_limit: 0,
      status: "active"
    }];
    allStudentRecords = studentRecords;
    otherTutors = [];
  } else {
    const [studentRecordsRes, allStudentsRes] = await Promise.all([
      admin
        .from("students")
        .select("*")
        .eq("tutor_id", tutor.id)
        .ilike("parent_email", user.email)
        .eq("status", "active"),
      admin
        .from("students")
        .select("tutor_id")
        .ilike("parent_email", user.email)
        .eq("status", "active")
    ]);

    studentRecords = studentRecordsRes.data;
    allStudentRecords = allStudentsRes.data;

    // Fetch other tutors if the parent is registered with multiple tutors
    if (allStudentRecords && allStudentRecords.length > 0) {
      const tutorIds = Array.from(new Set(allStudentRecords.map((s) => s.tutor_id)));
      if (tutorIds.length > 1) {
        const { data: tutorsData } = await admin
          .from("tutor_profiles")
          .select("username, display_name")
          .in("id", tutorIds);
        if (tutorsData) {
          otherTutors = tutorsData;
        }
      }
    }
  }

  if (!studentRecords || studentRecords.length === 0) {
    // Check for any pending workspace applications
    const { data: pendingRecords } = await admin
      .from("students")
      .select("student_name")
      .eq("tutor_id", tutor.id)
      .ilike("parent_email", user.email || "")
      .eq("status", "pending");

    if (pendingRecords && pendingRecords.length > 0) {
      return (
        <PortalThemeWrapper tutor={tutor}>
          <div className="min-h-screen flex flex-col bg-background">
            <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
              <div className="yazz-container flex h-16 max-w-5xl items-center justify-between gap-4">
                <Logo size="header" href="/" />
                <Link
                  href={`/tutor/${username}`}
                  className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" /> Back to Portal
                </Link>
              </div>
            </header>
            <main className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md w-full text-center space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mx-auto">
                  <Clock className="size-6 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">Application Pending</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your application to join <strong className="text-foreground">{tutor.displayName}</strong>&apos;s workspace is under review.
                  </p>
                  <div className="bg-muted/40 p-4 rounded-xl text-left border border-border/30 mt-2 space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Applying Students:</span>
                    {pendingRecords.map((r, i) => (
                      <span key={i} className="block text-sm font-bold text-foreground">• {r.student_name}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                    Once the tutor reviews and approves your request, you will receive an invitation email to set up your password and access your dashboard.
                  </p>
                </div>
                <div className="pt-2">
                  <form action="/auth/signout" method="post" className="w-full">
                    <button type="submit" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 cursor-pointer">
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

  // 3. Fetch lessons, tasks, open slots and booking/payment status
  let rawBookings: any[] | null = null;
  let rawTasks: any[] | null = null;
  let rawOpenSlots: any[] | null = null;
  let rawResources: any[] | null = null;
  let portalBooking: any = null;

  if (testVal === "dashboard") {
    rawBookings = [{
      id: "booking-mock-1",
      status: "confirmed",
      amount_cents: 4500,
      created_at: new Date().toISOString(),
      tutor_lesson_feedback: "Great focus on equations today!",
      lesson_rating: 5,
      running_late_note: null,
      availability_slots: [{ id: "slot-mock-1", starts_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(), ends_at: new Date(Date.now() + 3 * 3600 * 1000).toISOString() }]
    }];
    rawTasks = [{
      id: "task-mock-1",
      title: "Algebra Homework - Page 42",
      description: "Complete all questions from Section 3B. Show your work clearly.",
      status: "pending",
      tutor_feedback: "Check your signs on question 4.",
      created_at: new Date().toISOString(),
      completed_at: null,
    }];
    rawOpenSlots = [{
      id: "slot-mock-1",
      starts_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      ends_at: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      is_booked: true,
    }, {
      id: "slot-mock-2",
      starts_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      ends_at: new Date(Date.now() + 25 * 3600 * 1000).toISOString(),
      is_booked: false,
    }];
    rawResources = [{
      id: "resource-mock-1",
      title: "Algebra Foundations Pack",
      description: "Perfect for students beginning GCSE math. Explains standard form, simple equations, and brackets.",
      price_cents: 0,
      currency: "gbp",
      thumbnail_url: null,
      is_published: true,
    }];
    portalBooking = { canAcceptBookings: true };
  } else {
    const admin = createAdminClient();
    try {
      const [rawBookingsRes, rawTasksRes, rawOpenSlotsRes, rawResourcesRes, portalBookingRes] = await Promise.all([
        Promise.resolve(
          admin
            .from("bookings")
            .select(`
              id, 
              status, 
              amount_cents, 
              created_at, 
              tutor_lesson_feedback, 
              lesson_rating, 
              running_late_note, 
              availability_slots (id, starts_at, ends_at)
            `)
            .eq("tutor_id", tutor.id)
            .ilike("parent_email", user.email)
            .order("created_at", { ascending: false })
        )
          .then((res) => res)
          .catch((err) => {
            console.error("Error fetching bookings in workspace:", err);
            return { data: [], error: err };
          }),
        Promise.resolve(
          admin
            .from("student_tasks")
            .select("*")
            .eq("student_id", studentRecord!.id)
            .order("created_at", { ascending: false })
        )
          .then((res) => res)
          .catch((err) => {
            console.error("Error fetching tasks in workspace:", err);
            return { data: [], error: err };
          }),
        Promise.resolve(
          admin
            .from("availability_slots")
            .select("id, starts_at, ends_at, is_booked")
            .eq("tutor_id", tutor.id)
            .gte("starts_at", new Date().toISOString())
            .order("starts_at", { ascending: true })
        )
          .then((res) => res)
          .catch((err) => {
            console.error("Error fetching availability slots in workspace:", err);
            return { data: [], error: err };
          }),
        Promise.resolve(
          admin
            .from("digital_resources")
            .select("*")
            .eq("tutor_id", tutor.id)
            .eq("is_published", true)
            .order("created_at", { ascending: false })
        )
          .then((res) => res)
          .catch((err) => {
            console.error("Error fetching resources in workspace:", err);
            return { data: [], error: err };
          }),
        getPortalBookingStatus(tutor.id)
          .catch((err) => {
            console.error("Error fetching portal booking status in workspace:", err);
            return { canAcceptBookings: false, subscriptionActive: false };
          })
      ]);
      rawBookings = rawBookingsRes?.data ?? [];
      rawTasks = rawTasksRes?.data ?? [];
      rawOpenSlots = rawOpenSlotsRes?.data ?? [];
      rawResources = rawResourcesRes?.data ?? [];
      portalBooking = portalBookingRes ?? { canAcceptBookings: false, subscriptionActive: false };
    } catch (err) {
      console.error("Failed to load workspace data: ", err);
    }
  }

  if (!portalBooking) {
    portalBooking = { canAcceptBookings: false, subscriptionActive: false };
  }

  const paymentsEnabled = portalBooking.canAcceptBookings;

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
  const bookedIds = new Set((rawBookings ?? []).map(b => {
    const slot = Array.isArray(b.availability_slots) ? b.availability_slots[0] : b.availability_slots;
    return slot?.id;
  }).filter(Boolean));

  const calendarSlots = (rawOpenSlots ?? []).map((s) => {
    if (!s.is_booked) {
      return {
        id: s.id,
        startsAt: s.starts_at,
        endsAt: s.ends_at,
        isBooked: false,
        booking: null,
      };
    }

    if (bookedIds.has(s.id)) {
      const b = (rawBookings ?? []).find(booking => {
        const slot = Array.isArray(booking.availability_slots) 
          ? booking.availability_slots[0] 
          : booking.availability_slots;
        return slot?.id === s.id;
      });
      if (!b) return null;
      return {
        id: s.id,
        startsAt: s.starts_at,
        endsAt: s.ends_at,
        isBooked: true,
        booking: {
          id: b.id,
          parentEmail: user.email!,
          studentName: studentRecord.student_name,
          status: b.status,
          runningLateNote: b.running_late_note,
          runningLateSentAt: null,
          studentRunningLateSentAt: null,
          studentRunningLateNote: null,
          lessonReminderSentAt: null,
        }
      };
    }

    // Booked by someone else
    return {
      id: s.id,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      isBooked: true,
      booking: {
        id: "",
        parentEmail: "other@example.com",
        studentName: "Unavailable",
        status: "confirmed",
        runningLateNote: null,
        runningLateSentAt: null,
        studentRunningLateSentAt: null,
        studentRunningLateNote: null,
        lessonReminderSentAt: null,
      }
    };
  }).filter(Boolean) as any[];

  const tasks = (rawTasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status as "pending" | "completed",
    feedback: t.tutor_feedback,
    createdAt: t.created_at,
    completedAt: t.completed_at,
  }));

  const worksheets = (rawResources ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    priceCents: r.price_cents,
    currency: r.currency,
    thumbnailUrl: r.thumbnail_url ?? undefined,
  }));

  return (
    <PortalThemeWrapper tutor={tutor}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Navigation Header */}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="yazz-container flex h-16 max-w-5xl items-center justify-between gap-2 sm:gap-4">
            <Logo size="header" href="/" iconOnly={true} className="inline-flex sm:hidden shrink-0" />
            <Logo size="header" href="/" iconOnly={false} className="hidden sm:inline-flex shrink-0" />
            <div className="flex items-center gap-1.5 sm:gap-3">
              {otherTutors.length > 1 && (
                <div className="relative group">
                  <button className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary hover:underline transition-colors mr-1 cursor-pointer">
                    ⇄ Switch <span className="hidden xs:inline">Tutor</span> <ChevronDown className="size-3" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-lg hidden group-hover:block hover:block z-50 animate-in fade-in duration-200">
                    {otherTutors.map((t) => (
                      <Link
                        key={t.username}
                        href={`/tutor/${t.username}/workspace`}
                        className={`block px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted transition-colors ${
                          t.username === username ? "text-primary bg-primary/5 font-bold" : "text-foreground"
                        }`}
                      >
                        {t.display_name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {studentRecords.length > 1 && (
                <Link
                  href={`/tutor/${username}/workspace`}
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary hover:underline transition-colors mr-1 shrink-0"
                >
                  ⇄ Switch <span className="hidden xs:inline">Student</span>
                </Link>
              )}
              <span className="hidden md:inline-block text-xs font-semibold text-muted-foreground bg-muted/70 px-2.5 py-1 rounded-lg">
                Student: {studentRecord.student_name}
              </span>
              <InstallAppButton size="sm" variant="outline" className="hidden sm:inline-flex shrink-0" />
              <PushSubscriptionToggle />
              <Link
                href={`/tutor/${username}/workspace/guide`}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:text-foreground transition-colors p-2 rounded-lg border border-primary/20 hover:bg-primary/5 bg-primary/5 shadow-sm sm:py-1.5 sm:px-3 shrink-0"
                title="Guide & Simulator"
              >
                <BookOpen className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Guide & Simulator</span>
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg border border-border hover:bg-muted/30 bg-background/30 sm:py-1.5 sm:px-3 shrink-0"
                title="Support & AI Helper"
              >
                <HelpCircle className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Support & AI Helper</span>
              </Link>
              <form action="/auth/signout" method="post" className="shrink-0">
                <button type="submit" className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg border border-border hover:bg-destructive/5 cursor-pointer sm:py-1.5 sm:px-3" title="Sign Out">
                  <LogOut className="size-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="yazz-container max-w-5xl flex-1 py-8 sm:py-10 space-y-8">
          {/* Push notification promo banner */}
          <PushNotificationBanner />

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
                <ArrowLeft className="size-3.5" /> Tutor Shop &amp; Bookings
              </Link>
            </div>
          </div>

          <Suspense fallback={null}>
            <WorkspaceDashboard
              tutor={{
                id: tutor.id,
                username: username,
                displayName: tutor.displayName,
                lessonPriceCents: tutor.lessonPriceCents,
                currency: tutor.currency,
                allowCashPayments: tutor.allowCashPayments,
              }}
              studentRecord={{
                id: studentRecord.id,
                student_name: studentRecord.student_name,
                lesson_credits: studentRecord.lesson_credits,
                credit_limit: studentRecord.credit_limit,
              }}
              otherTutors={otherTutors}
              studentRecords={studentRecords}
              upcomingLessons={upcomingLessons}
              pastLessons={pastLessons}
              tasks={tasks}
              worksheets={worksheets}
              calendarSlots={calendarSlots}
              paymentsEnabled={paymentsEnabled}
              parentEmail={user.email!}
              username={username}
            />
          </Suspense>
        </main>
      </div>
    </PortalThemeWrapper>
  );
}
