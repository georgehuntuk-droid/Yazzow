"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Message = {
  id: string;
  sender: "tutor" | "parent";
  content: string;
  created_at: string;
};

type WorkspaceChatProps = {
  tutorId: string;
  tutorDisplayName: string;
};

export function WorkspaceChat({ tutorId, tutorDisplayName }: WorkspaceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages
  async function loadMessages(isSilent = false) {
    try {
      const response = await fetch(`/api/messages?tutorId=${encodeURIComponent(tutorId)}`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.ok) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Load workspace messages failed:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }

  // Poll for new messages
  useEffect(() => {
    loadMessages();

    const interval = setInterval(() => {
      void loadMessages(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [tutorId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle message send
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    setError(null);

    const messageText = content.trim();
    setContent("");

    // Optimistically add message
    const tempId = Math.random().toString();
    const optimisticMessage: Message = {
      id: tempId,
      sender: "parent",
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorId, content: messageText }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message.");
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error ?? "Failed to send message.");
      }

      // Replace optimistic message with actual
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? data.message : msg))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
      // Remove optimistic message
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setContent(messageText); // restore input
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="yazz-surface w-full border-primary/10 flex flex-col h-[500px]">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="font-heading text-lg sm:text-xl flex items-center gap-2">
          💬 Message {tutorDisplayName}
        </CardTitle>
        <CardDescription>
          Direct and secure conversation with your tutor.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2 animate-pulse">
            <Loader2 className="size-6 animate-spin text-primary" />
            Loading conversation…
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable messages log */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin scrollbar-thumb-muted"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <span className="text-3xl mb-2">👋</span>
                  <p className="text-sm font-semibold">No messages yet.</p>
                  <p className="text-xs max-w-[240px] mt-1 leading-relaxed">
                    Send a message to {tutorDisplayName} to start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isParent = msg.sender === "parent";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isParent ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm leading-normal whitespace-pre-wrap ${
                          isParent
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted/70 text-foreground rounded-tl-none border border-border/40"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold mt-1 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {error ? (
              <p className="text-xs text-destructive mt-2 font-semibold bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-1.5">
                ⚠️ {error}
              </p>
            ) : null}

            {/* Input Composer Form */}
            <form onSubmit={handleSend} className="flex gap-2 mt-3 pt-3 border-t border-border/40">
              <Input
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Message ${tutorDisplayName}…`}
                className="h-10 bg-background flex-1"
                disabled={sending}
              />
              <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={sending}>
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
