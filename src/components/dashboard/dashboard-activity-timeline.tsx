"use client";

import { 
  CheckCircle, 
  MessageSquare, 
  CreditCard, 
  Sparkles, 
  Mail, 
  ChevronRight,
  Bell
} from "lucide-react";
import { formatMoney } from "@/lib/format";

type ActivityItem = {
  id: string;
  type: "completed" | "message" | "payment" | "alert";
  title: string;
  description: string;
  time: string;
  meta?: string;
  chatBubble?: string;
};

type DashboardActivityTimelineProps = {
  currency: string;
  lessonPriceCents: number;
};

export function DashboardActivityTimeline({ currency, lessonPriceCents }: DashboardActivityTimelineProps) {
  const activities: ActivityItem[] = [
    {
      id: "1",
      type: "completed",
      title: "Lesson Completed",
      description: "Leo Chen finished GCSE Mathematics session.",
      time: "2 hours ago",
      meta: "Status: confirmed"
    },
    {
      id: "2",
      type: "message",
      title: "New Message",
      description: "From parent of Emily Watson:",
      time: "4 hours ago",
      chatBubble: "Hi Sarah, do we need the WORKBOOK for the next class?"
    },
    {
      id: "3",
      type: "payment",
      title: "Payment Received",
      description: "Swift payment for 4 sessions processed.",
      time: "Yesterday",
      meta: formatMoney(lessonPriceCents * 4, currency)
    },
    {
      id: "4",
      type: "alert",
      title: "Slot Alert Sent",
      description: "2 families instantly notified about a newly opened Friday 10am slot.",
      time: "Yesterday"
    }
  ];

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm shadow-blue-500/5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="size-4 text-primary animate-pulse" />
          Recent Activity
        </h3>
        <button className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-0.5">
          View All
          <ChevronRight className="size-3" />
        </button>
      </div>

      <div className="relative pl-6 border-l-2 border-border/50 space-y-6">
        {activities.map((item) => {
          return (
            <div key={item.id} className="relative group">
              {/* Timeline dot / icon */}
              <div className={`absolute -left-[35px] top-0 size-6.5 rounded-full flex items-center justify-center border-4 border-card transition duration-200 group-hover:scale-110 ${
                item.type === "completed" ? "bg-emerald-500 text-white" :
                item.type === "message" ? "bg-blue-500 text-white" :
                item.type === "payment" ? "bg-primary text-white" :
                "bg-amber-500 text-white"
              }`}>
                {item.type === "completed" && <CheckCircle className="size-3" />}
                {item.type === "message" && <MessageSquare className="size-3" />}
                {item.type === "payment" && <CreditCard className="size-3" />}
                {item.type === "alert" && <Bell className="size-3" />}
              </div>

              {/* Activity Info */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-foreground">{item.title}</span>
                  <span className="text-[11px] font-semibold text-muted-foreground">{item.time}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground mt-1 leading-normal">
                  {item.description}
                </p>

                {/* If it's a message, display the chat bubble like in the mockup! */}
                {item.chatBubble && (
                  <div className="mt-2 rounded-2xl rounded-tl-none bg-blue-50/50 border border-blue-100/50 p-3 text-xs font-medium text-foreground relative max-w-sm">
                    <p className="italic text-muted-foreground/90 font-medium">
                      &ldquo;{item.chatBubble}&rdquo;
                    </p>
                  </div>
                )}

                {/* If there's metadata/price */}
                {item.meta && (
                  <span className="inline-flex mt-1.5 rounded-lg bg-primary/5 px-2 py-0.5 text-xs font-bold text-primary">
                    {item.meta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
