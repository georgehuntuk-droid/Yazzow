"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, AlertCircle, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Custom helper to render basic Markdown features (headers, bold text, bullet points) cleanly without external dependencies.
function formatBotResponse(text: string): React.ReactNode {
  return text.split("\n").map((line, idx) => {
    let content: React.ReactNode = line;
    let className = "text-sm leading-relaxed";

    // Handle Headers (e.g. ### Header)
    if (line.startsWith("### ")) {
      content = line.replace("### ", "");
      className = "text-base font-bold text-foreground mt-4 mb-2 first:mt-0";
    } else if (line.startsWith("## ")) {
      content = line.replace("## ", "");
      className = "text-lg font-bold text-foreground mt-4 mb-2 first:mt-0";
    }

    // Handle Bullet points (e.g. - item or * item)
    const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
    if (isBullet) {
      const cleanLine = line.trim().replace(/^[-*]\s+/, "");
      
      // Inline bold parsing within bullet point
      const boldParts = cleanLine.split(/\*\*(.*?)\*\*/g);
      const formattedParts = boldParts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-semibold text-foreground">{part}</strong>;
        }
        return part;
      });

      return (
        <ul key={idx} className="list-disc pl-5 my-1.5 space-y-1">
          <li className="text-sm text-muted-foreground leading-relaxed">{formattedParts}</li>
        </ul>
      );
    }

    // Inline bold parsing for general lines
    if (typeof content === "string") {
      const boldParts = content.split(/\*\*(.*?)\*\*/g);
      if (boldParts.length > 1) {
        content = boldParts.map((part, pIdx) => {
          if (pIdx % 2 === 1) {
            return <strong key={pIdx} className="font-semibold text-foreground">{part}</strong>;
          }
          return part;
        });
      }
    }

    return (
      <p key={idx} className={`${className} my-1`}>
        {content}
      </p>
    );
  });
}

const suggestions = [
  "How do I cancel my subscription?",
  "Are worksheets refundable?",
  "How does the credit limit work?",
  "I have a technical issue with payouts",
];

type Message = {
  role: "user" | "model";
  content: string;
};

type AiChatProps = {
  onEscalate: (chatLog: string, suggestedCategory: string) => void;
};

export function AiChat({ onEscalate }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "### Hello! How can I help you? 👋\n\nI am the Yazzow Support Assistant. I can answer questions about tutor subscriptions, digital worksheets, lesson credits/limits, Stripe, and tech issues. If you need further help, you can escalate to our support team at any time!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current && messages.length > 1) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const chatHistory = [...messages, userMsg];
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const data = (await res.json()) as { reply?: string; error?: string };
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "model", content: data.reply! }]);
      } else {
        throw new Error(data.error || "No reply from assistant");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "⚠️ Sorry, I encountered a connection issue. Please try sending your message again, or click 'Escalate to Support Ticket' below to contact our admin directly.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(inputValue);
  }

  function handleEscalateClick() {
    // Compile a clean transcript of the chat session
    const transcript = messages
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n");

    // Attempt to guess the category from conversation
    let category = "other";
    const fullTranscriptLower = transcript.toLowerCase();
    if (fullTranscriptLower.includes("billing") || fullTranscriptLower.includes("cancel") || fullTranscriptLower.includes("refund")) {
      category = "billing";
    } else if (fullTranscriptLower.includes("bug") || fullTranscriptLower.includes("broken") || fullTranscriptLower.includes("tech")) {
      category = "bug";
    } else if (fullTranscriptLower.includes("account") || fullTranscriptLower.includes("password") || fullTranscriptLower.includes("login")) {
      category = "account";
    } else if (fullTranscriptLower.includes("feature") || fullTranscriptLower.includes("request")) {
      category = "feature";
    }

    const prefilledMessage = `--- Chat Transcript with AI Assistant ---\n${transcript}\n\n--- Please describe your issue in more detail ---\n`;
    onEscalate(prefilledMessage, category);
  }

  return (
    <Card className="yazz-surface flex flex-col h-[580px] overflow-hidden">
      <CardHeader className="border-b border-border/40 py-4 shrink-0 bg-background/50 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <div>
              <CardTitle className="font-heading text-base font-semibold">AI Support Assistant</CardTitle>
              <CardDescription className="text-xs">Instant answers for Yazzow questions</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEscalateClick}
            className="text-xs flex items-center gap-1.5 hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <MessageSquare className="size-3.5" />
            Talk to Human
          </Button>
        </div>
      </CardHeader>

      {/* Chat messages */}
      <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-muted/5">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground border border-border/60"
              }`}
            >
              {msg.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
            </div>
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-background border border-border/80 rounded-tl-none text-muted-foreground shadow-sm"
              }`}
            >
              {msg.role === "user" ? (
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="space-y-1">{formatBotResponse(msg.content)}</div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-2.5 max-w-[80%] mr-auto">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground border border-border/60 shrink-0">
              <Bot className="size-3.5" />
            </div>
            <div className="bg-background border border-border/80 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground italic">Thinking...</span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Suggestion tags */}
      {messages.length === 1 && !isTyping && (
        <div className="px-4 py-2 bg-background/50 border-t border-border/40 shrink-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Suggested Questions</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(sug)}
                className="text-xs rounded-full border border-border hover:border-primary/50 bg-background hover:bg-primary/5 px-3 py-1 text-muted-foreground hover:text-primary transition-all cursor-pointer text-left"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat inputs */}
      <div className="border-t border-border/40 p-3 bg-background shrink-0">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question..."
            disabled={isTyping}
            className="flex-1"
          />
          <Button type="submit" disabled={isTyping || !inputValue.trim()} size="icon" className="shrink-0 cursor-pointer">
            <Send className="size-4" />
          </Button>
        </form>
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-[10px] text-muted-foreground">
            AI Assistant resolves most queries instantly.
          </p>
          <button
            type="button"
            onClick={handleEscalateClick}
            className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            Still have issues? Escalated to ticket
            <AlertCircle className="size-2.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
