"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Archive, ArchiveRestore, ChevronDown, Star, Trash2, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addStudent,
  deleteStudent,
  saveLessonFeedback,
  updateStudentNotes,
  updateStudentStatus,
  assignStudentTask,
  deleteStudentTask,
  saveTaskFeedback,
  toggleTaskStatus,
  resendStudentInvitation,
} from "@/lib/dashboard/actions";
import { formatMoney, formatSlotRange } from "@/lib/format";
import type { StudentWithLessons } from "@/lib/tutors/student-lessons";
import { cn } from "@/lib/utils";

type StudentLedgerProps = {
  students: { active: StudentWithLessons[]; archived: StudentWithLessons[] };
  currency: string;
};

const RATING_LABELS = ["", "Needs work", "Below expected", "On track", "Strong", "Excellent"] as const;

export function StudentLedger({ students, currency }: StudentLedgerProps) {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [editingEmails, setEditingEmails] = useState<Record<string, string>>({});
  const [savingDetailsId, setSavingDetailsId] = useState<string | null>(null);
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<
    Record<string, { text: string; rating: number | null }>
  >({});

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await addStudent({ studentName, parentEmail, notes });
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setStudentName("");
    setParentEmail("");
    setNotes("");
    router.refresh();
    setLoading(false);
  }

  const [optimisticCredits, setOptimisticCredits] = useState<Record<string, number>>({});
  const [optimisticLimits, setOptimisticLimits] = useState<Record<string, number>>({});
  const [savingCredits, setSavingCredits] = useState<Record<string, boolean>>({});
  const [savingLimits, setSavingLimits] = useState<Record<string, boolean>>({});

  const saveTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const baselineCreditsRef = useRef<Record<string, number>>({});
  const baselineLimitsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    setOptimisticCredits((prev) => {
      const next = { ...prev };
      students.active.concat(students.archived).forEach((s) => {
        if (next[s.id] === s.lessonCredits) {
          delete next[s.id];
        }
      });
      return next;
    });
    setOptimisticLimits((prev) => {
      const next = { ...prev };
      students.active.concat(students.archived).forEach((s) => {
        if (next[s.id] === s.creditLimit) {
          delete next[s.id];
        }
      });
      return next;
    });
  }, [students]);

  useEffect(() => {
    return () => {
      Object.values(saveTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  async function handleSaveNotes(studentId: string) {
    const value = editingNotes[studentId];
    if (value === undefined) return;

    setSavingNotesId(studentId);
    setError(null);
    const result = await updateStudentNotes(studentId, value);
    setSavingNotesId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleSaveDetails(studentId: string, name: string, email: string) {
    setSavingDetailsId(studentId);
    const { updateStudentDetails } = await import("@/lib/dashboard/actions");
    const result = await updateStudentDetails(studentId, name, email);
    setSavingDetailsId(null);

    if (!result.ok) {
      alert(result.error || "Failed to update student details.");
    }
    router.refresh();
  }

  async function handleResendInvite(studentId: string) {
    setSendingInviteId(studentId);
    const result = await resendStudentInvitation(studentId);
    setSendingInviteId(null);

    if (!result.ok) {
      alert(result.error || "Failed to send invitation email.");
    } else {
      alert("Invitation email sent successfully!");
    }
    router.refresh();
  }

  async function handleSaveCredits(studentId: string, credits: number) {
    if (baselineCreditsRef.current[studentId] === undefined) {
      baselineCreditsRef.current[studentId] = students.active.concat(students.archived).find((s) => s.id === studentId)?.lessonCredits ?? 0;
    }

    setOptimisticCredits((prev) => ({ ...prev, [studentId]: credits }));
    setSavingCredits((prev) => ({ ...prev, [studentId]: true }));
    setError(null);

    if (saveTimeoutsRef.current[`credits-${studentId}`]) {
      clearTimeout(saveTimeoutsRef.current[`credits-${studentId}`]);
    }

    saveTimeoutsRef.current[`credits-${studentId}`] = setTimeout(async () => {
      const { updateStudentCredits } = await import("@/lib/dashboard/actions");
      const result = await updateStudentCredits(studentId, credits);

      setSavingCredits((prev) => ({ ...prev, [studentId]: false }));
      delete baselineCreditsRef.current[studentId];

      if (!result.ok) {
        const rollbackVal = students.active.concat(students.archived).find((s) => s.id === studentId)?.lessonCredits ?? 0;
        setOptimisticCredits((prev) => ({ ...prev, [studentId]: rollbackVal }));
        setError(result.error);
        return;
      }
      router.refresh();
    }, 600);
  }

  async function handleSaveCreditLimit(studentId: string, limit: number) {
    if (baselineLimitsRef.current[studentId] === undefined) {
      baselineLimitsRef.current[studentId] = students.active.concat(students.archived).find((s) => s.id === studentId)?.creditLimit ?? 0;
    }

    setOptimisticLimits((prev) => ({ ...prev, [studentId]: limit }));
    setSavingLimits((prev) => ({ ...prev, [studentId]: true }));
    setError(null);

    if (saveTimeoutsRef.current[`limit-${studentId}`]) {
      clearTimeout(saveTimeoutsRef.current[`limit-${studentId}`]);
    }

    saveTimeoutsRef.current[`limit-${studentId}`] = setTimeout(async () => {
      const { updateStudentCreditLimit } = await import("@/lib/dashboard/actions");
      const result = await updateStudentCreditLimit(studentId, limit);

      setSavingLimits((prev) => ({ ...prev, [studentId]: false }));
      delete baselineLimitsRef.current[studentId];

      if (!result.ok) {
        const rollbackVal = students.active.concat(students.archived).find((s) => s.id === studentId)?.creditLimit ?? 0;
        setOptimisticLimits((prev) => ({ ...prev, [studentId]: rollbackVal }));
        setError(result.error);
        return;
      }
      router.refresh();
    }, 600);
  }

  async function handleArchive(studentId: string, studentLabel: string) {
    if (
      !confirm(
        `Archive ${studentLabel}? They stay in your records but won't appear in your active list. You can restore them anytime.`,
      )
    ) {
      return;
    }

    const result = await updateStudentStatus(studentId, "archived");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleRestore(studentId: string) {
    const result = await updateStudentStatus(studentId, "active");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete(studentId: string, studentLabel: string) {
    if (
      !confirm(
        `Permanently remove ${studentLabel} from your ledger? Lesson history stays in bookings.`,
      )
    ) {
      return;
    }

    const result = await deleteStudent(studentId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleSaveFeedback(bookingId: string) {
    const draft = feedbackDraft[bookingId];
    const result = await saveLessonFeedback({
      bookingId,
      feedback: draft?.text,
      lessonRating: draft?.rating ?? null,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="yazz-surface">
        <CardHeader>
          <CardTitle>Add a student</CardTitle>
          <CardDescription>
            Families also appear when they join your portal or book a lesson.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="student-name" className="text-sm font-medium">
                Student name
              </label>
              <Input
                id="student-name"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Alex Smith"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="parent-email" className="text-sm font-medium">
                Parent email
              </label>
              <Input
                id="parent-email"
                type="email"
                required
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="student-notes" className="text-sm font-medium">
                General notes
              </label>
              <Input
                id="student-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Year group, goals, temperament…"
              />
            </div>
            <div className="sm:col-span-2">
              {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={loading}>
                {loading ? "Adding…" : "Add student"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({students.active.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({students.archived.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4 space-y-3">
          <StudentList
            list={students.active}
            currency={currency}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            editingNotes={editingNotes}
            setEditingNotes={setEditingNotes}
            editingNames={editingNames}
            setEditingNames={setEditingNames}
            editingEmails={editingEmails}
            setEditingEmails={setEditingEmails}
            onSaveDetails={handleSaveDetails}
            onResendInvite={handleResendInvite}
            sendingInviteId={sendingInviteId}
            feedbackDraft={feedbackDraft}
            setFeedbackDraft={setFeedbackDraft}
            onSaveNotes={handleSaveNotes}
            onSaveCredits={handleSaveCredits}
            onSaveCreditLimit={handleSaveCreditLimit}
            onSaveFeedback={handleSaveFeedback}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
            mode="active"
            optimisticCredits={optimisticCredits}
            optimisticLimits={optimisticLimits}
            savingCredits={savingCredits}
            savingLimits={savingLimits}
          />
        </TabsContent>
        <TabsContent value="archived" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Archived students are off your active roster. Restore them if they return, or
            delete to remove the record.
          </p>
          <StudentList
            list={students.archived}
            currency={currency}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            editingNotes={editingNotes}
            setEditingNotes={setEditingNotes}
            editingNames={editingNames}
            setEditingNames={setEditingNames}
            editingEmails={editingEmails}
            setEditingEmails={setEditingEmails}
            onSaveDetails={handleSaveDetails}
            onResendInvite={handleResendInvite}
            sendingInviteId={sendingInviteId}
            feedbackDraft={feedbackDraft}
            setFeedbackDraft={setFeedbackDraft}
            onSaveNotes={handleSaveNotes}
            onSaveCredits={handleSaveCredits}
            onSaveCreditLimit={handleSaveCreditLimit}
            onSaveFeedback={handleSaveFeedback}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
            mode="archived"
            optimisticCredits={optimisticCredits}
            optimisticLimits={optimisticLimits}
            savingCredits={savingCredits}
            savingLimits={savingLimits}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StudentList({
  list,
  currency,
  expandedId,
  setExpandedId,
  editingNotes,
  setEditingNotes,
  editingNames,
  setEditingNames,
  editingEmails,
  setEditingEmails,
  onSaveDetails,
  onResendInvite,
  sendingInviteId,
  feedbackDraft,
  setFeedbackDraft,
  onSaveNotes,
  onSaveCredits,
  onSaveCreditLimit,
  onSaveFeedback,
  onArchive,
  onRestore,
  onDelete,
  mode,
  optimisticCredits,
  optimisticLimits,
  savingCredits,
  savingLimits,
}: {
  list: StudentWithLessons[];
  currency: string;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  editingNotes: Record<string, string>;
  setEditingNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  editingNames: Record<string, string>;
  setEditingNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  editingEmails: Record<string, string>;
  setEditingEmails: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSaveDetails: (id: string, name: string, email: string) => void;
  onResendInvite: (id: string) => void;
  sendingInviteId: string | null;
  feedbackDraft: Record<string, { text: string; rating: number | null }>;
  setFeedbackDraft: React.Dispatch<
    React.SetStateAction<Record<string, { text: string; rating: number | null }>>
  >;
  onSaveNotes: (id: string) => void;
  onSaveCredits: (id: string, credits: number) => Promise<void>;
  onSaveCreditLimit: (id: string, limit: number) => Promise<void>;
  onSaveFeedback: (bookingId: string) => void;
  onArchive: (id: string, label: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string, label: string) => void;
  mode: "active" | "archived";
  optimisticCredits: Record<string, number>;
  optimisticLimits: Record<string, number>;
  savingCredits: Record<string, boolean>;
  savingLimits: Record<string, boolean>;
}) {
  const router = useRouter();
  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {mode === "active"
          ? "No active students yet."
          : "No archived students."}
      </p>
    );
  }

  const confirmedLessons = (student: StudentWithLessons) =>
    student.lessons.filter((l) => l.status === "confirmed");

  return (
    <>
      {list.map((student) => {
        const open = expandedId === student.id;
        const draftNotes = editingNotes[student.id] ?? student.notes ?? "";
        const draftName = editingNames[student.id] ?? student.studentName;
        const draftEmail = editingEmails[student.id] ?? student.parentEmail;
        const lessons = confirmedLessons(student);

        const currentCredits = optimisticCredits[student.id] !== undefined
          ? optimisticCredits[student.id]
          : student.lessonCredits;
        
        const currentLimit = optimisticLimits[student.id] !== undefined
          ? optimisticLimits[student.id]
          : student.creditLimit;

        return (
          <Card key={student.id} className="yazz-surface overflow-hidden">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left hover:bg-muted/30"
              onClick={() => setExpandedId(open ? null : student.id)}
            >
              <div>
                <p className="font-medium">{student.studentName}</p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <p className="text-xs text-muted-foreground">{student.parentEmail}</p>
                  <Link
                    href={`/dashboard/messages?email=${encodeURIComponent(student.parentEmail)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <MessageSquare className="size-3 text-primary" />
                    Chat on Website
                  </Link>
                  {student.hasAccount ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                      Linked
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/30 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                        Pending Sign-up
                      </span>
                      <button
                        type="button"
                        disabled={sendingInviteId === student.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onResendInvite(student.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sendingInviteId === student.id ? "Sending..." : "Resend Invite"}
                      </button>
                    </>
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Badge variant={mode === "active" ? "default" : "secondary"}>
                    {mode === "active" ? "Active" : "Archived"}
                  </Badge>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1">
                    {currentCredits} credit{currentCredits === 1 ? "" : "s"}
                    {savingCredits[student.id] && (
                      <Loader2 className="size-3 animate-spin text-primary/70" />
                    )}
                  </Badge>
                  <Badge variant="outline">
                    {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "mt-1 size-5 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>

            {open ? (
              <CardContent className="space-y-4 border-t border-border/60 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student Name</label>
                    <Input
                      value={draftName}
                      onChange={(e) =>
                        setEditingNames((prev) => ({
                          ...prev,
                          [student.id]: e.target.value,
                        }))
                      }
                      onBlur={() => {
                        if (draftName.trim() && draftName.trim() !== student.studentName) {
                           onSaveDetails(student.id, draftName, draftEmail);
                        }
                      }}
                      placeholder="Student name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parent Email</label>
                    <Input
                      value={draftEmail}
                      type="email"
                      onChange={(e) =>
                        setEditingEmails((prev) => ({
                          ...prev,
                          [student.id]: e.target.value,
                        }))
                      }
                      onBlur={() => {
                        if (draftEmail.trim() && draftEmail.trim() !== student.parentEmail) {
                           onSaveDetails(student.id, draftName, draftEmail);
                        }
                      }}
                      placeholder="parent@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lesson credits</label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9"
                        disabled={savingCredits[student.id]}
                        onClick={() => onSaveCredits(student.id, currentCredits - 1)}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center text-base font-bold">
                        {currentCredits}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9"
                        disabled={savingCredits[student.id]}
                        onClick={() => onSaveCredits(student.id, currentCredits + 1)}
                      >
                        +
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
                        Override
                        {savingCredits[student.id] && (
                          <Loader2 className="size-3 animate-spin text-muted-foreground" />
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credit Limit</label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9"
                        disabled={savingLimits[student.id]}
                        onClick={() => onSaveCreditLimit(student.id, Math.max(0, currentLimit - 1))}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center text-base font-bold">
                        {currentLimit}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9"
                        disabled={savingLimits[student.id]}
                        onClick={() => onSaveCreditLimit(student.id, currentLimit + 1)}
                      >
                        +
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
                        Overdraft
                        {savingLimits[student.id] && (
                          <Loader2 className="size-3 animate-spin text-muted-foreground" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">General notes</label>
                  <Input
                    value={draftNotes}
                    onChange={(e) =>
                      setEditingNotes((prev) => ({
                        ...prev,
                        [student.id]: e.target.value,
                      }))
                    }
                    onBlur={() => {
                      if (draftNotes.trim() !== (student.notes ?? "").trim()) {
                        onSaveNotes(student.id);
                      }
                    }}
                    placeholder="Ongoing notes about this student…"
                  />
                </div>

                {/* Assigned Work & Tasks */}
                <div className="space-y-3 border-t border-border/60 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Assigned Work & Tasks</p>
                      <p className="text-xs text-muted-foreground">
                        Set tasks, assignments or homework. Students can view and mark them as completed in their portal.
                      </p>
                    </div>
                  </div>

                  {student.tasks && student.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {student.tasks.map((task) => (
                        <div key={task.id} className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/10 p-3 text-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-0.5">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                task.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              )}>
                                {task.status === "completed" ? "Completed" : "Pending"}
                              </span>
                              <p className={cn("font-semibold", task.status === "completed" && "line-through text-muted-foreground")}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground leading-normal mt-0.5">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
                              <button
                                type="button"
                                onClick={async () => {
                                  const newStatus = task.status === "completed" ? "pending" : "completed";
                                  await toggleTaskStatus(task.id, newStatus);
                                  router.refresh();
                                }}
                                className="font-semibold hover:text-primary transition-colors cursor-pointer"
                              >
                                Mark {task.status === "completed" ? "Pending" : "Completed"}
                              </button>
                              <span className="text-muted-foreground/30">|</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm("Delete this task?")) {
                                    await deleteStudentTask(task.id);
                                    router.refresh();
                                  }
                                }}
                                className="font-semibold text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="mt-1 space-y-1.5 border-t border-border/40 pt-2">
                            <label className="text-[11px] font-semibold text-muted-foreground">Tutor Notes / Feedback</label>
                            <input
                              type="text"
                              defaultValue={task.tutorFeedback ?? ""}
                              placeholder="Add feedback, resources or hints for this task..."
                              onBlur={async (e) => {
                                if (e.target.value !== (task.tutorFeedback ?? "")) {
                                  await saveTaskFeedback(task.id, e.target.value);
                                  router.refresh();
                                }
                              }}
                              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No tasks assigned yet.</p>
                  )}

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const title = String(formData.get("taskTitle") ?? "").trim();
                      const desc = String(formData.get("taskDesc") ?? "").trim();
                      
                      if (!title) return;
                      
                      const res = await assignStudentTask({ studentId: student.id, title, description: desc });
                      if (res.ok) {
                        form.reset();
                        router.refresh();
                      } else {
                        alert(res.error);
                      }
                    }}
                    className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3 bg-card"
                  >
                    <p className="text-xs font-semibold text-foreground">Assign New Task</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        name="taskTitle"
                        required
                        placeholder="Task title (e.g., Complete Chapter 3 exercises)"
                        className="h-8 text-xs rounded-lg"
                      />
                      <Input
                        name="taskDesc"
                        placeholder="Description / instructions (optional)"
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>
                    <Button type="submit" size="xs" className="self-start text-[11px] h-7 px-3 font-semibold rounded-lg mt-1">
                      Assign Task
                    </Button>
                  </form>
                </div>

                <div className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-sm font-medium">Lesson feedback (optional)</p>
                  <p className="text-xs text-muted-foreground">
                    Private to you — how the lesson went, performance, whether you want to
                    continue. Not shared with parents unless you tell them.
                  </p>
                  {lessons.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No confirmed lessons yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {lessons.map((lesson) => {
                        const draft = feedbackDraft[lesson.id] ?? {
                          text: lesson.tutorLessonFeedback ?? "",
                          rating: lesson.lessonRating,
                        };

                        return (
                          <li
                            key={lesson.id}
                            className="rounded-xl border border-border/70 bg-muted/20 p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium">
                                {formatSlotRange(lesson.startsAt, lesson.endsAt)}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatMoney(lesson.amountCents, currency)}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  title={RATING_LABELS[n]}
                                  onClick={() =>
                                    setFeedbackDraft((prev) => ({
                                      ...prev,
                                      [lesson.id]: {
                                        ...draft,
                                        rating: draft.rating === n ? null : n,
                                      },
                                    }))
                                  }
                                  className={cn(
                                    "rounded-md p-1 transition-colors",
                                    draft.rating != null && n <= draft.rating
                                      ? "text-primary"
                                      : "text-muted-foreground/40 hover:text-primary/60",
                                  )}
                                >
                                  <Star
                                    className={cn(
                                      "size-4",
                                      draft.rating != null &&
                                        n <= draft.rating &&
                                        "fill-current",
                                    )}
                                  />
                                </button>
                              ))}
                              {draft.rating ? (
                                <span className="ml-2 self-center text-xs text-muted-foreground">
                                  {RATING_LABELS[draft.rating]}
                                </span>
                              ) : null}
                            </div>
                            <textarea
                              rows={2}
                              value={draft.text}
                              onChange={(e) =>
                                setFeedbackDraft((prev) => ({
                                  ...prev,
                                  [lesson.id]: { ...draft, text: e.target.value },
                                }))
                              }
                              placeholder="How did the lesson go? Progress, behaviour, follow-up…"
                              className="mt-2 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={() => onSaveFeedback(lesson.id)}
                            >
                              Save feedback
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                  {mode === "active" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onArchive(student.id, student.studentName)}
                    >
                      <Archive className="size-3.5" data-icon="inline-start" />
                      Archive student
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRestore(student.id)}
                    >
                      <ArchiveRestore className="size-3.5" data-icon="inline-start" />
                      Restore to active
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(student.id, student.studentName)}
                  >
                    <Trash2 className="size-3.5" data-icon="inline-start" />
                    Remove record
                  </Button>
                </div>
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </>
  );
}
