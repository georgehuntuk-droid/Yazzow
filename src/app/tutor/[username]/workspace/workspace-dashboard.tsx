"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, 
  CalendarRange, 
  CheckCircle2, 
  Clock, 
  GraduationCap, 
  MessageCircle, 
  ChevronDown,
  Sparkles,
  Calendar,
  BookMarked
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspaceClient } from "./workspace-client";
import { TwoWeekCalendar } from "@/components/dashboard/two-week-calendar";
import { WorkspaceChat } from "@/components/booking/workspace-chat";
import { PwaInstallBanner } from "@/components/pwa/install-app-banner";
import { formatSlotRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ResourceShelf } from "@/components/tutor/resource-shelf";
import type { DigitalResource } from "@/lib/types";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "completed";
  feedback: string | null;
  createdAt: string;
  completedAt: string | null;
};

type WorkspaceDashboardProps = {
  tutor: {
    id: string;
    username: string;
    displayName: string;
    lessonPriceCents: number;
    currency: string;
    allowCashPayments?: boolean;
  };
  studentRecord: {
    id: string;
    student_name: string;
    lesson_credits: number;
    credit_limit: number;
  };
  otherTutors: { username: string; display_name: string }[];
  studentRecords: any[];
  upcomingLessons: any[];
  pastLessons: any[];
  tasks: Task[];
  worksheets: DigitalResource[];
  calendarSlots: any[];
  paymentsEnabled: boolean;
  parentEmail: string;
  username: string;
};

export function WorkspaceDashboard({
  tutor,
  studentRecord,
  otherTutors,
  studentRecords,
  upcomingLessons,
  pastLessons,
  tasks,
  worksheets,
  calendarSlots,
  paymentsEnabled,
  parentEmail,
  username
}: WorkspaceDashboardProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // activeTab can be "tasks" | "chat" | "worksheets" | "calendar" | "info"
  const [activeTab, setActiveTab] = useState<"tasks" | "chat" | "worksheets" | "calendar" | "info">(
    (tabParam === "chat" || tabParam === "worksheets" || tabParam === "calendar" || tabParam === "info")
      ? tabParam
      : "tasks"
  );

  useEffect(() => {
    if (tabParam === "chat" || tabParam === "worksheets" || tabParam === "calendar" || tabParam === "info") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const pendingTasksCount = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Premium PWA Install Banner */}
      <PwaInstallBanner />

      {/* Stats row */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="yazz-surface hover:border-primary/20 transition-all duration-200">
          <CardContent className="p-3 sm:p-5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3.5">
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <GraduationCap className="size-4.5 sm:size-5" />
            </div>
            <div className="min-w-0 flex flex-col items-center sm:items-start w-full">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider truncate w-full">Credits</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5 leading-none">{studentRecord.lesson_credits}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="yazz-surface hover:border-blue-500/20 transition-all duration-200">
          <CardContent className="p-3 sm:p-5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3.5">
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
              <CalendarRange className="size-4.5 sm:size-5" />
            </div>
            <div className="min-w-0 flex flex-col items-center sm:items-start w-full">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider truncate w-full">Lessons</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5 leading-none">{upcomingLessons.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="yazz-surface hover:border-emerald-500/20 transition-all duration-200">
          <CardContent className="p-3 sm:p-5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3.5">
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="size-4.5 sm:size-5" />
            </div>
            <div className="min-w-0 flex flex-col items-center sm:items-start w-full">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider truncate w-full">Tasks Done</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5 leading-none">
                {tasks.filter((t) => t.status === "completed").length}/{tasks.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Desktop Left / Mobile Main Column (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Tab Navigation header */}
          <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
            {/* Desktop Left-Panel Tabs (Tasks vs Worksheets vs Calendar) */}
            <div className="hidden lg:flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/40">
              <button
                onClick={() => setActiveTab("tasks")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  (activeTab === "tasks" || activeTab === "chat")
                    ? "bg-background text-primary shadow-sm border border-border/20 font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="size-3.5" />
                Homework & Tasks
                {pendingTasksCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.2 ml-1">
                    {pendingTasksCount}
                  </Badge>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab("worksheets")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  activeTab === "worksheets"
                    ? "bg-background text-primary shadow-sm border border-border/20 font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookMarked className="size-3.5" />
                Worksheets
                {worksheets.length > 0 && (
                  <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.2 ml-1 border-muted-foreground/20">
                    {worksheets.length}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab("calendar")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  (activeTab === "calendar" || activeTab === "info")
                    ? "bg-background text-primary shadow-sm border border-border/20 font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Calendar className="size-3.5" />
                Lesson Calendar & Booking
              </button>
            </div>

            {/* Mobile Tab bar (All 5 options: Tasks, Chat, Worksheets, Calendar, Info) */}
            <div className="lg:hidden flex w-full items-center justify-around bg-muted/40 p-1 rounded-xl border border-border/40">
              <button
                onClick={() => setActiveTab("tasks")}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all flex-1 justify-center cursor-pointer",
                  activeTab === "tasks" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                )}
              >
                <BookOpen className="size-3.5" />
                <span className="hidden xs:inline">Tasks</span>
                {pendingTasksCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[9px] px-1 py-0.1 ml-0.5 scale-90">
                    {pendingTasksCount}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab("chat")}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all flex-1 justify-center cursor-pointer",
                  activeTab === "chat" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                )}
              >
                <MessageCircle className="size-3.5" />
                <span className="hidden xs:inline">Chat</span>
              </button>

              <button
                onClick={() => setActiveTab("worksheets")}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all flex-1 justify-center cursor-pointer",
                  activeTab === "worksheets" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                )}
              >
                <BookMarked className="size-3.5" />
                <span className="hidden xs:inline">Worksheets</span>
              </button>

              <button
                onClick={() => setActiveTab("calendar")}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all flex-1 justify-center cursor-pointer",
                  activeTab === "calendar" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                )}
              >
                <Calendar className="size-3.5" />
                <span className="hidden xs:inline">Book</span>
              </button>

              <button
                onClick={() => setActiveTab("info")}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all flex-1 justify-center cursor-pointer",
                  activeTab === "info" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                )}
              >
                <Clock className="size-3.5" />
                <span className="hidden xs:inline">Schedule</span>
              </button>
            </div>
          </div>

          {/* Render Tab Contents */}
          <div className="space-y-4">
            {/* 1. Tasks Content: Visible on mobile and desktop if tasks or chat */}
            <div className={cn(
              "space-y-3",
              (activeTab === "tasks" || activeTab === "chat") ? "block" : "hidden"
            )}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-base font-bold text-foreground">Homework & Tasks</h3>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {pendingTasksCount} active
                  </Badge>
                </div>
                <WorkspaceClient initialTasks={tasks} />
              </div>
            </div>

            {/* 2. Worksheets Content: Visible on mobile and desktop if worksheets */}
            <div className={cn(
              "space-y-3",
              activeTab === "worksheets" ? "block" : "hidden"
            )}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-base font-bold text-foreground">Worksheets & Resources</h3>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {worksheets.length} available
                  </Badge>
                </div>
                <ResourceShelf resources={worksheets} />
              </div>
            </div>

            {/* 3. Calendar Content: Visible on mobile and desktop if calendar or info */}
            <div className={cn(
              "space-y-3",
              (activeTab === "calendar" || activeTab === "info") ? "block" : "hidden"
            )}>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <h3 className="font-heading text-base font-bold text-foreground">Lesson Calendar & Availability</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    Click open slot to book / booked lessons to cancel
                  </p>
                </div>
                <TwoWeekCalendar
                  role="student"
                  slots={calendarSlots}
                  tutor={{
                    id: tutor.id,
                    username: username,
                    displayName: tutor.displayName,
                    lessonPriceCents: tutor.lessonPriceCents,
                    currency: tutor.currency,
                    allowCashPayments: tutor.allowCashPayments,
                  }}
                  parentEmail={parentEmail}
                  studentName={studentRecord.student_name}
                  studentCredits={studentRecord.lesson_credits}
                  creditLimit={studentRecord.credit_limit}
                  paymentsEnabled={paymentsEnabled}
                />
              </div>
            </div>

            {/* 3. Mobile Only Chat Tab Content */}
            <div className={cn("lg:hidden", activeTab === "chat" ? "block" : "hidden")}>
              <WorkspaceChat tutorId={tutor.id} tutorDisplayName={tutor.displayName} />
            </div>

            {/* 4. Mobile Only Info (Schedule/Feedback) Tab Content */}
            <div className={cn("lg:hidden space-y-6", activeTab === "info" ? "block" : "hidden")}>
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
                      <div key={lesson.id} className="rounded-xl border border-border bg-card p-3 text-xs flex justify-between items-center">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground">1-on-1 Lesson</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatSlotRange(lesson.startsAt, lesson.endsAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0">
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
        </div>

        {/* Desktop Sidebar (1/3 width, hidden on mobile since content is accessible via tabs) */}
        <div className="hidden lg:flex flex-col gap-6">
          <WorkspaceChat tutorId={tutor.id} tutorDisplayName={tutor.displayName} />

          {/* Upcoming schedule */}
          <section className="space-y-3">
            <h3 className="font-heading text-sm font-black uppercase text-muted-foreground tracking-wider">Upcoming Schedule</h3>
            {upcomingLessons.length === 0 ? (
              <div className="yazz-panel px-4 py-6 text-center text-xs text-muted-foreground italic">
                No upcoming lessons booked.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingLessons.map((lesson) => (
                  <div key={lesson.id} className="rounded-xl border border-border bg-card p-3 text-xs flex justify-between items-center hover:border-primary/10 transition-colors">
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground">1-on-1 Lesson</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatSlotRange(lesson.startsAt, lesson.endsAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0.2">
                      Booked
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Past feedback */}
          <section className="space-y-3">
            <h3 className="font-heading text-sm font-black uppercase text-muted-foreground tracking-wider">Past Lesson Feedback</h3>
            {pastLessons.filter((b) => b.feedback || b.rating).length === 0 ? (
              <div className="yazz-panel px-4 py-6 text-center text-xs text-muted-foreground italic">
                No lesson feedback available yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {pastLessons
                  .filter((b) => b.feedback || b.rating)
                  .map((lesson) => (
                    <div key={lesson.id} className="rounded-xl border border-border bg-card p-3 text-xs space-y-2 hover:border-primary/15 transition-colors">
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
    </div>
  );
}
