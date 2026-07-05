"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, MessageCircle, X, Calendar, BookOpen, FileText, Loader2 } from "lucide-react";

import { toggleTaskStatus, submitStudentTaskFeedback } from "@/lib/dashboard/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "completed";
  feedback: string | null;
  createdAt: string;
  completedAt: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  studentFeedback?: string | null;
};

type WorkspaceClientProps = {
  initialTasks: Task[];
};

export function WorkspaceClient({ initialTasks }: WorkspaceClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [studentFeedbackInput, setStudentFeedbackInput] = useState("");
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [optimisticTaskStatuses, setOptimisticTaskStatuses] = useState<Record<string, "pending" | "completed">>({});

  useEffect(() => {
    setOptimisticTaskStatuses((prev) => {
      const next = { ...prev };
      initialTasks.forEach((t) => {
        if (next[t.id] === t.status) {
          delete next[t.id];
        }
      });
      return next;
    });
  }, [initialTasks]);

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setStudentFeedbackInput(task.studentFeedback ?? "");
  };

  async function handleSaveFeedback() {
    if (!selectedTask) return;
    setIsSavingFeedback(true);
    const res = await submitStudentTaskFeedback(selectedTask.id, studentFeedbackInput);
    setIsSavingFeedback(false);
    if (!res.ok) {
      alert(res.error);
    } else {
      setSelectedTask({
        ...selectedTask,
        studentFeedback: studentFeedbackInput.trim() || null,
      });
      router.refresh();
    }
  }

  async function handleToggleStatus(taskId: string, currentStatus: "pending" | "completed") {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    setOptimisticTaskStatuses((prev) => ({ ...prev, [taskId]: newStatus }));
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date().toISOString() : null,
      });
    }

    setUpdatingId(taskId);
    startTransition(async () => {
      const res = await toggleTaskStatus(taskId, newStatus);
      if (!res.ok) {
        alert(res.error);
        setOptimisticTaskStatuses((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask({
            ...selectedTask,
            status: currentStatus,
            completedAt: currentStatus === "completed" ? new Date().toISOString() : null,
          });
        }
      }
      setUpdatingId(null);
      router.refresh();
    });
  }

  const getTaskStatus = (t: Task) => optimisticTaskStatuses[t.id] !== undefined ? optimisticTaskStatuses[t.id] : t.status;
  const pendingTasks = initialTasks.filter((t) => getTaskStatus(t) === "pending");
  const completedTasks = initialTasks.filter((t) => getTaskStatus(t) === "completed");

  return (
    <div className="space-y-6">
      {/* Pending Tasks */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">To Do</h3>
        {pendingTasks.length === 0 ? (
          <div className="yazz-panel px-6 py-10 text-center text-sm text-muted-foreground bg-muted/10 border-dashed">
            🎉 All caught up! No pending tasks assigned.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map((task) => {
              const isUpdating = updatingId === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => handleOpenTask(task)}
                  className={cn(
                    "rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:scale-[1.005] cursor-pointer group relative",
                    isUpdating && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening modal when checking box
                        handleToggleStatus(task.id, getTaskStatus(task));
                      }}
                      className="mt-0.5 shrink-0 text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer relative z-10"
                    >
                      <Circle className="size-5" />
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors pr-6">{task.title}</p>
                        <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap self-start mt-0.5">
                          Open Details →
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground leading-normal line-clamp-2">{task.description}</p>
                      )}

                      {/* Display feedback if exists */}
                      {task.feedback && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-xs">
                          <MessageCircle className="size-4 text-primary shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-primary">Tutor hint/feedback:</span>
                            <p className="text-muted-foreground italic leading-relaxed line-clamp-2">&ldquo;{task.feedback}&rdquo;</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/60">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed</h3>
          <div className="space-y-3">
            {completedTasks.map((task) => {
              const isUpdating = updatingId === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => handleOpenTask(task)}
                  className={cn(
                    "rounded-xl border border-border bg-card/60 p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:scale-[1.005] cursor-pointer group relative",
                    isUpdating && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening modal when checking box
                        handleToggleStatus(task.id, getTaskStatus(task));
                      }}
                      className="mt-0.5 shrink-0 text-emerald-500 hover:text-muted-foreground/60 transition-colors cursor-pointer relative z-10"
                    >
                      <CheckCircle2 className="size-5 fill-emerald-50 text-emerald-500" />
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-semibold text-muted-foreground leading-snug line-through group-hover:text-primary transition-colors pr-6">{task.title}</p>
                        <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap self-start mt-0.5">
                          Open Details →
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground/60 leading-normal line-through line-clamp-1">{task.description}</p>
                      )}

                      {/* Display feedback if exists */}
                      {task.feedback && (
                        <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-muted/50 p-2.5 text-xs border border-border/60">
                          <MessageCircle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-muted-foreground">Tutor feedback:</span>
                            <p className="text-muted-foreground/80 italic leading-relaxed line-clamp-1">&ldquo;{task.feedback}&rdquo;</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Details Dialog Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop with premium glass blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTask(null)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Top Bar with Status Badge & Close button */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
              <Badge
                variant={selectedTask.status === "completed" ? "outline" : "default"}
                className={cn(
                  "font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5",
                  selectedTask.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                    : "bg-primary/10 text-primary border border-primary/20"
                )}
              >
                {selectedTask.status === "completed" ? "✓ Completed" : "⚡ To Do"}
              </Badge>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Task Meta details */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground leading-snug">
                  {selectedTask.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pt-1">
                  <Calendar className="size-3.5 text-primary" />
                  <span>
                    Assigned:{" "}
                    {new Date(selectedTask.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Description / Instructions */}
              <div className="space-y-1.5 pt-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="size-3.5" />
                  Instructions / Description
                </h4>
                <div className="bg-muted/40 p-4 rounded-2xl border border-border/40 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[120px] overflow-y-auto">
                  {selectedTask.description ? selectedTask.description : (
                    <span className="italic text-muted-foreground">No additional instructions provided.</span>
                  )}
                </div>
              </div>

              {/* Attachment Display */}
              {selectedTask.attachmentUrl && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="size-3.5" />
                    Task Attachment / Worksheet
                  </h4>
                  <div className="bg-primary/5 p-3 rounded-2xl border border-primary/15 text-xs text-foreground/95 flex items-center justify-between">
                    <span className="font-semibold truncate max-w-[200px]">{selectedTask.attachmentName || "Attached Worksheet"}</span>
                    <a
                      href={selectedTask.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-primary/95 shadow-sm shrink-0"
                    >
                      📁 Open Attachment
                    </a>
                  </div>
                </div>
              )}

              {/* Tutor Hint / Feedback */}
              {selectedTask.feedback && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <MessageCircle className="size-3.5" />
                    Tutor Notes & Feedback
                  </h4>
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/15 text-sm text-foreground/90 leading-relaxed italic">
                    &ldquo;{selectedTask.feedback}&rdquo;
                  </div>
                </div>
              )}

              {/* Student Feedback / Thoughts on this task */}
              <div className="space-y-2 pt-3 border-t border-border/40">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="size-3.5 text-primary" />
                  Your Feedback / Thoughts
                </h4>
                <textarea
                  value={studentFeedbackInput}
                  onChange={(e) => setStudentFeedbackInput(e.target.value)}
                  placeholder="How did you find this homework? Leave feedback for your tutor..."
                  className="flex min-h-[50px] w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring text-foreground leading-normal resize-y"
                />
                <Button
                  type="button"
                  size="xs"
                  disabled={isSavingFeedback || studentFeedbackInput.trim() === (selectedTask.studentFeedback ?? "")}
                  onClick={handleSaveFeedback}
                  className="self-start text-[11px] h-7 px-3 font-semibold rounded-lg shadow-sm"
                >
                  {isSavingFeedback ? "Saving..." : "Save Feedback"}
                </Button>
              </div>
            </div>

            {/* Footer with Complete/Uncomplete action button */}
            <div className="mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row gap-2.5 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedTask(null)}
                className="rounded-xl px-5 font-bold cursor-pointer"
              >
                Close
              </Button>
              <Button
                type="button"
                disabled={updatingId === selectedTask.id}
                onClick={() => handleToggleStatus(selectedTask.id, selectedTask.status)}
                className={cn(
                  "rounded-xl px-5 font-bold cursor-pointer shadow-sm",
                  selectedTask.status === "completed"
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-primary text-white hover:bg-primary/90"
                )}
              >
                {updatingId === selectedTask.id ? "Updating..." : (
                  selectedTask.status === "completed" ? "Mark as Pending" : "✓ Mark as Complete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
