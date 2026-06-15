import { Users } from "lucide-react";

import { requireTutorProfile } from "@/lib/auth/session";
import { getStudentsWithLessonsForTutor } from "@/lib/tutors/student-lessons";
import { StudentLedger } from "@/components/dashboard/student-ledger";
import { DashboardShell } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Student Directory · ${BRAND_NAME}`,
};

export default async function StudentsPage() {
  const { profile } = await requireTutorProfile();
  const studentGroups = await getStudentsWithLessonsForTutor(profile.id);

  return (
    <DashboardShell>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Student Directory
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">
              Track your student rosters, active hours, and lesson feedback history
            </p>
          </div>
        </div>

        {/* Informative prompt card */}
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-4">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
            Review detailed feedback logs from past lessons, view student schedules, or archive learners who have finished their study tracks with you.
          </p>
        </div>

        {/* Student Ledger Card container */}
        <Card className="yazz-surface border-border/80 shadow-md">
          <CardContent className="p-6">
            <StudentLedger
              students={studentGroups}
              currency={profile.currency}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
