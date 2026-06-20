import { OnboardingForm } from "@/components/auth/onboarding-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { requireUser } from "@/lib/auth/session";
import { getTutorProfileForUser } from "@/lib/tutors/queries";
import { redirect } from "next/navigation";
import { BRAND_NAME } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Clock, LogOut, RefreshCw, GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: `Set up your portal · ${BRAND_NAME}`,
};

type OnboardingPageProps = {
  searchParams: Promise<{ role?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { role } = await searchParams;
  
  const user = await requireUser({ redirectTo: "/onboarding" });
  const existing = await getTutorProfileForUser(user.id);

  if (existing) {
    redirect("/dashboard");
  }

  // 1. Query student records case-insensitively using Admin Client
  let studentRecords: any[] = [];
  let tutorProfilesMap: Record<string, { username: string; displayName: string }> = {};

  if (user.email) {
    const admin = createAdminClient();
    const { data: students } = await admin
      .from("students")
      .select("id, student_name, tutor_id")
      .ilike("parent_email", user.email)
      .eq("status", "active");

    if (students && students.length > 0) {
      studentRecords = students;
      const tutorIds = Array.from(new Set(students.map(s => s.tutor_id)));
      const { data: tutors } = await admin
        .from("tutor_profiles")
        .select("id, username, display_name")
        .in("id", tutorIds);

      if (tutors) {
        tutors.forEach(t => {
          tutorProfilesMap[t.id] = {
            username: t.username,
            displayName: t.display_name
          };
        });
      }
    }
  }

  interface TutorWithStudents {
    username: string;
    displayName: string;
    students: any[];
  }

  // Group students by tutor
  const tutorGroups = studentRecords.reduce<Record<string, TutorWithStudents>>((acc, student) => {
    const tutorId = student.tutor_id;
    const tutorInfo = tutorProfilesMap[tutorId];
    if (!tutorInfo) return acc;
    
    if (!acc[tutorId]) {
      acc[tutorId] = {
        username: tutorInfo.username,
        displayName: tutorInfo.displayName,
        students: []
      };
    }
    acc[tutorId].students.push(student);
    return acc;
  }, {});

  const uniqueTutors = Object.values(tutorGroups);

  // 2. Redirect/launcher logic
  if (uniqueTutors.length === 1) {
    const tutor = uniqueTutors[0];
    const destination =
      tutor.students.length === 1
        ? `/tutor/${tutor.username}/workspace?studentId=${tutor.students[0].id}`
        : `/tutor/${tutor.username}/workspace`;
    redirect(destination);
  }

  if (uniqueTutors.length > 1) {
    return (
      <AuthShell
        title="Select your workspace"
        subtitle="You are registered with multiple tutors. Select a classroom below to access homework, tasks, and scheduling."
      >
        <div className="space-y-6">
          <div className="space-y-3">
            {uniqueTutors.map((tutor) => {
              const href =
                tutor.students.length === 1
                  ? `/tutor/${tutor.username}/workspace?studentId=${tutor.students[0].id}`
                  : `/tutor/${tutor.username}/workspace`;
              return (
                <Link
                  key={tutor.username}
                  href={href}
                  className="group block w-full rounded-2xl border border-primary/10 bg-card/50 p-5 shadow-sm backdrop-blur-sm hover:border-primary/40 hover:bg-primary/[0.02] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1.5 text-left">
                      <h3 className="font-heading text-base font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {tutor.displayName}
                        <Sparkles className="size-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Student{tutor.students.length > 1 ? "s" : ""}:{" "}
                        <strong className="text-foreground font-semibold">
                          {tutor.students.map((s) => s.student_name).join(", ")}
                        </strong>
                      </p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <ArrowRight className="size-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border/40">
            <form action="/auth/signout" method="post" className="w-full">
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
              >
                <LogOut className="size-3.5" />
                Sign out of this account
              </button>
            </form>
          </div>
        </div>
      </AuthShell>
    );
  }

  // No active student records found
  if (role === "parent") {
    return (
      <AuthShell
        title="Waiting for tutor link"
        subtitle={`Your student account (${user.email}) is successfully registered.`}
      >
        <div className="space-y-6">
          <Card className="yazz-surface border-primary/10 shadow-[0_8px_32px_oklch(0.42_0.15_286/0.1)]">
            <CardContent className="pt-6 space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
                <Clock className="size-6 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Pending Activation
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ask your tutor to add your email to their student directory:
                </p>
                <div className="bg-muted/60 p-2.5 rounded-xl border border-border/40 font-mono text-xs text-foreground select-all break-all max-w-full inline-block">
                  {user.email}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1.5">
                  Once added, refresh this status check to automatically access your dashboard.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/onboarding?role=parent"
              className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="size-4" />
              Check status again
            </Link>
            <form action="/auth/signout" method="post" className="w-full">
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </AuthShell>
    );
  }

  // Default: Tutor onboarding
  const defaultDisplayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Tutor";

  return (
    <AuthShell
      title="Claim your portal link"
      subtitle="Choose a username parents can remember. This becomes your private booking page — never listed in a marketplace."
    >
      <OnboardingForm defaultDisplayName={defaultDisplayName} />
    </AuthShell>
  );
}
