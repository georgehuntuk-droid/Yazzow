"use client";

import { useState } from "react";
import { AiChat } from "./ai-chat";
import { SupportTicketForm } from "./ticket-form";
import { MessageSquareShare, MessageSquareText } from "lucide-react";

export function SupportContainer() {
  const [activeTab, setActiveTab] = useState<"chat" | "ticket">("chat");
  const [escalatedMessage, setEscalatedMessage] = useState("");
  const [escalatedCategory, setEscalatedCategory] = useState("other");
  const [showEscalatedAlert, setShowEscalatedAlert] = useState(false);

  function handleEscalate(transcript: string, category: string) {
    setEscalatedMessage(transcript);
    setEscalatedCategory(category);
    setActiveTab("ticket");
    setShowEscalatedAlert(true);
    // Auto-dismiss alert after 5 seconds
    setTimeout(() => {
      setShowEscalatedAlert(false);
    }, 5000);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
      <div>
        <p className="text-sm font-medium text-primary">Help centre</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold">Support</h1>
        <p className="mt-4 max-w-xl yazz-muted leading-relaxed">
          Something not working? Billing question? Use our interactive AI assistant for instant answers, or submit a support ticket to be reviewed by our admin panel.
        </p>

        {/* Premium Tab Selectors */}
        <div className="mt-8 flex gap-6 border-b border-border/80 pb-px">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "chat"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquareText className="size-4" />
            AI Chat Assistant
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ticket")}
            className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "ticket"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquareShare className="size-4" />
            Submit Ticket
          </button>
        </div>

        {/* Guided instructions */}
        <ul className="mt-8 space-y-3.5 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary font-bold">1.</span>
            Our AI Chat resolves subscription questions, credit details, and worksheet policies immediately.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">2.</span>
            If the AI helper cannot solve your query, click "Escalate" to transfer the conversation log into a support ticket.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">3.</span>
            Platform administrators review submitted tickets daily and respond back in a timely manner.
          </li>
        </ul>

        {showEscalatedAlert && (
          <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-900 text-xs animate-in fade-in slide-in-from-top-1 duration-300">
            <span className="font-semibold block mb-0.5">ℹ️ Conversation Escalated</span>
            We have pre-filled your ticket category and message with a transcript of your conversation with the AI assistant. Please review and hit submit!
          </div>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/dashboard" className="font-medium text-primary hover:underline">
            Go to dashboard
          </a>
        </p>
      </div>

      <div className="w-full">
        {activeTab === "chat" ? (
          <AiChat onEscalate={handleEscalate} />
        ) : (
          <SupportTicketForm
            initialMessage={escalatedMessage}
            initialCategory={escalatedCategory}
          />
        )}
      </div>
    </div>
  );
}
