"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, ArchiveRestore, ChevronDown, Star, Trash2, Mail } from "lucide-react";

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

  const [updatingCreditsId, setUpdatingCreditsId] = useState<string | null>(null);

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

  async function handleSaveCredits(studentId: string, credits: number) {
    setUpdatingCreditsId(studentId);
    setError(null);
    const { updateStudentCredits } = await import("@/lib/dashboard/actions");
    const result = await updateStudentCredits(studentId, credits);
    setUpdatingCreditsId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
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
            feedbackDraft={feedbackDraft}
            setFeedbackDraft={setFeedbackDraft}
            onSaveNotes={handleSaveNotes}
            onSaveCredits={handleSaveCredits}
            onSaveFeedback={handleSaveFeedback}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
            mode="active"
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
            feedbackDraft={feedbackDraft}
            setFeedbackDraft={setFeedbackDraft}
            onSaveNotes={handleSaveNotes}
            onSaveCredits={handleSaveCredits}
            onSaveFeedback={handleSaveFeedback}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
            mode="archived"
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
  feedbackDraft,
  setFeedbackDraft,
  onSaveNotes,
  onSaveCredits,
  onSaveFeedback,
  onArchive,
  onRestore,
  onDelete,
  mode,
}: {
  list: StudentWithLessons[];
  currency: string;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  editingNotes: Record<string, string>;
  setEditingNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  feedbackDraft: Record<string, { text: string; rating: number | null }>;
  setFeedbackDraft: React.Dispatch<
    React.SetStateAction<Record<string, { text: string; rating: number | null }>>
  >;
  onSaveNotes: (id: string) => void;
  onSaveCredits: (id: string, credits: number) => Promise<void>;
  onSaveFeedback: (bookingId: string) => void;
  onArchive: (id: string, label: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string, label: string) => void;
  mode: "active" | "archived";
}) {
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
        const lessons = confirmedLessons(student);

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
                  <a
                    href={`mailto:${student.parentEmail}?subject=Lesson Update - Yazzow`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Mail className="size-3 text-primary" />
                    Email Parent
                  </a>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Badge variant={mode === "active" ? "default" : "secondary"}>
                    {mode === "active" ? "Active" : "Archived"}
                  </Badge>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {student.lessonCredits} credit{student.lessonCredits === 1 ? "" : "s"}
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
              <CardContent className="space-y-4 border-t border-border/60 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">General notes</label>
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lesson credits</label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9"
                        onClick={() => onSaveCredits(student.id, Math.max(0, student.lessonCredits - 1))}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center text-base font-bold">
                        {student.lessonCredits}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9"
                        onClick={() => onSaveCredits(student.id, student.lessonCredits + 1)}
                      >
                        +
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1">
                        Manual override
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
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
