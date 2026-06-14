"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock, MessageCircle, AlertCircle } from "lucide-react";

import { toggleTaskStatus } from "@/lib/dashboard/actions";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "completed";
  feedback: string | null;
  createdAt: string;
  completedAt: string | null;
};

type WorkspaceClientProps = {
  initialTasks: Task[];
};

export function WorkspaceClient({ initialTasks }: WorkspaceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleToggleStatus(taskId: string, currentStatus: "pending" | "completed") {
    setUpdatingId(taskId);
    startTransition(async () => {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      const res = await toggleTaskStatus(taskId, newStatus);
      if (!res.ok) {
        alert(res.error);
      }
      setUpdatingId(null);
      router.refresh();
    });
  }

  const pendingTasks = initialTasks.filter((t) => t.status === "pending");
  const completedTasks = initialTasks.filter((t) => t.status === "completed");

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
                  className={cn(
                    "rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-sm",
                    isUpdating && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggleStatus(task.id, task.status)}
                      className="mt-0.5 shrink-0 text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
                    >
                      <Circle className="size-5" />
                    </button>
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-foreground leading-snug">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground leading-normal">{task.description}</p>
                      )}

                      {/* Display feedback if exists */}
                      {task.feedback && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-xs">
                          <MessageCircle className="size-4 text-primary shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-primary">Tutor hint/feedback:</span>
                            <p className="text-muted-foreground italic leading-relaxed">&ldquo;{task.feedback}&rdquo;</p>
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
                  className={cn(
                    "rounded-xl border border-border bg-card/60 p-4 transition-all duration-200",
                    isUpdating && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggleStatus(task.id, task.status)}
                      className="mt-0.5 shrink-0 text-emerald-500 hover:text-muted-foreground/60 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="size-5 fill-emerald-50 text-emerald-500" />
                    </button>
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-muted-foreground leading-snug line-through">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground/60 leading-normal line-through">{task.description}</p>
                      )}

                      {/* Display feedback if exists */}
                      {task.feedback && (
                        <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-muted/50 p-2.5 text-xs border border-border/60">
                          <MessageCircle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-muted-foreground">Tutor feedback:</span>
                            <p className="text-muted-foreground/80 italic leading-relaxed">&ldquo;{task.feedback}&rdquo;</p>
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
    </div>
  );
}
