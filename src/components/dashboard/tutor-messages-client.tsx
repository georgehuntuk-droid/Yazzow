"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, MessageSquare, AlertCircle, Paperclip } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Thread = {
  parentEmail: string;
  studentName: string | null;
  latestMessageContent: string;
  latestMessageTime: string;
  unreadCount: number;
};

type Message = {
  id: string;
  sender: "tutor" | "parent";
  content: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  created_at: string;
};

function formatChatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";

  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";

  if (d.getFullYear() !== now.getFullYear()) {
    return `${month} ${day}${suffix}, ${d.getFullYear()}`;
  }
  return `${month} ${day}${suffix}`;
}

type TutorMessagesClientProps = {
  tutorId: string;
};

export function TutorMessagesClient({ tutorId }: TutorMessagesClientProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadEmail, setActiveThreadEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  useEffect(() => {
    if (emailParam) {
      const email = emailParam.trim().toLowerCase();
      setActiveThreadEmail(email);

      setThreads((prev) => {
        const exists = prev.some((t) => t.parentEmail.toLowerCase() === email);
        if (!exists) {
          return [
            {
              parentEmail: emailParam,
              studentName: null,
              latestMessageContent: "Click send to start chatting…",
              latestMessageTime: new Date().toISOString(),
              unreadCount: 0,
            },
            ...prev,
          ];
        }
        return prev;
      });
    }
  }, [emailParam]);

  // Load threads
  async function loadThreads(isSilent = false) {
    try {
      const response = await fetch("/api/messages");
      if (!response.ok) return;
      const data = await response.json();
      if (data.ok) {
        setThreads(data.threads);
      }
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      if (!isSilent) setLoadingThreads(false);
    }
  }

  // Load messages for the active thread
  async function loadMessages(parentEmail: string, isSilent = false) {
    if (!isSilent) setLoadingMessages(true);
    try {
      const response = await fetch(
        `/api/messages?parentEmail=${encodeURIComponent(parentEmail)}`
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data.ok) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  }

  // Poll for threads and active thread messages
  useEffect(() => {
    loadThreads();

    const interval = setInterval(() => {
      void loadThreads(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Poll active thread messages when active thread changes
  useEffect(() => {
    if (!activeThreadEmail) {
      setMessages([]);
      return;
    }

    loadMessages(activeThreadEmail);

    const interval = setInterval(() => {
      if (activeThreadEmail) {
        void loadMessages(activeThreadEmail, true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeThreadEmail]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle message send
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!content.trim() && !uploading) || !activeThreadEmail || sending) return;

    setSending(true);
    setError(null);

    const messageText = content.trim();
    setContent("");

    // Optimistically add message
    const tempId = Math.random().toString();
    const optimisticMessage: Message = {
      id: tempId,
      sender: "tutor",
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentEmail: activeThreadEmail, content: messageText }),
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

      // Reload threads to update latest message preview
      void loadThreads(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
      // Remove optimistic message
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setContent(messageText); // restore input
    } finally {
      setSending(false);
    }
  }

  // Handle File upload and send attachment
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeThreadEmail) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("/api/messages/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || "File upload failed.");
      }

      const uploadData = await uploadRes.json();
      if (!uploadData.ok) {
        throw new Error(uploadData.error || "File upload failed.");
      }

      // Send message with the attachment!
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentEmail: activeThreadEmail,
          content: content.trim() || `Sent an attachment: ${file.name}`,
          attachmentUrl: uploadData.url,
          attachmentName: uploadData.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message with attachment.");
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setMessages((prev) => [...prev, data.message]);
      setContent("");
      void loadThreads(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const activeThread = threads.find((t) => t.parentEmail.toLowerCase() === activeThreadEmail?.toLowerCase());

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-0 divide-x divide-border/40">
      {/* Left Column: Threads List */}
      <div className="w-80 flex flex-col min-h-0 bg-card/40 shrink-0">
        {loadingThreads && threads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <Loader2 className="size-5 animate-spin text-primary" />
            Loading chats…
          </div>
        ) : threads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <MessageSquare className="size-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-semibold">Your inbox is empty</p>
            <p className="text-xs max-w-[200px] mt-1 leading-relaxed">
              When parents send you a message from their booking page, they will show up here.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-border/30">
            {threads.map((thread) => {
              const isActive = thread.parentEmail.toLowerCase() === activeThreadEmail?.toLowerCase();
              return (
                <button
                  key={thread.parentEmail}
                  type="button"
                  onClick={() => {
                    setActiveThreadEmail(thread.parentEmail);
                    // Reset unread count locally for speed
                    setThreads((prev) =>
                      prev.map((t) =>
                        t.parentEmail.toLowerCase() === thread.parentEmail.toLowerCase() ? { ...t, unreadCount: 0 } : t
                      )
                    );
                  }}
                  className={cn(
                    "w-full text-left p-4 flex flex-col gap-1 transition-all duration-150 border-l-2",
                    isActive
                      ? "bg-primary/5 border-primary shadow-sm"
                      : "border-transparent hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-foreground truncate max-w-[170px]">
                      {thread.studentName || thread.parentEmail}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                      {new Date(thread.latestMessageTime).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {thread.studentName && (
                    <span className="text-[11px] text-muted-foreground font-semibold truncate -mt-0.5">
                      {thread.parentEmail}
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-xs text-muted-foreground truncate flex-1 leading-normal">
                      {thread.latestMessageContent}
                    </p>
                    {thread.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground font-black text-[10px] px-1.5 py-0.5 rounded-full shrink-0 min-w-4 text-center">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Chat Box */}
      <div className="flex-1 flex flex-col min-h-0 bg-background">
        {activeThreadEmail ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Thread Header */}
            <div className="px-6 py-4 border-b border-border/40 shrink-0 bg-muted/20">
              <h2 className="font-bold text-base text-foreground leading-normal">
                {activeThread?.studentName || activeThreadEmail}
              </h2>
              {activeThread?.studentName && (
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Parent Email: {activeThreadEmail}
                </p>
              )}
            </div>

            {/* Chat Body */}
            <div className="flex-1 flex flex-col min-h-0 p-6">
              {loadingMessages ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  Loading message history…
                </div>
              ) : (
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-muted"
                >
                  {messages.map((msg, index) => {
                    const isTutor = msg.sender === "tutor";
                    const showSeparator =
                      index === 0 ||
                      new Date(messages[index - 1].created_at).toDateString() !==
                        new Date(msg.created_at).toDateString();
                    return (
                      <div key={msg.id} className="space-y-4">
                        {showSeparator && (
                          <div className="flex justify-center my-4">
                            <span className="bg-muted/80 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] font-black text-muted-foreground uppercase tracking-wider border border-border/30">
                              {formatChatDate(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex flex-col ${isTutor ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm leading-normal whitespace-pre-wrap ${
                              isTutor
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-muted/70 text-foreground rounded-tl-none border border-border/40"
                            }`}
                          >
                            <div className="space-y-1.5">
                              {msg.content && <div>{msg.content}</div>}
                              {msg.attachment_url && (
                                <a
                                  href={msg.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 mt-1 px-2.5 py-1.5 rounded-xl bg-background/20 hover:bg-background/30 text-xs font-semibold border border-foreground/10 transition-colors cursor-pointer"
                                >
                                  <Paperclip className="size-3.5 shrink-0" />
                                  <span className="truncate max-w-[200px] underline">
                                    {msg.attachment_name || "Attachment"}
                                  </span>
                                </a>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-semibold mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {error && (
                <p className="text-xs text-destructive mt-3 font-semibold bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                  <AlertCircle className="size-4 text-destructive" />
                  {error}
                </p>
              )}

              {/* Chat Composer */}
              <form
                onSubmit={handleSend}
                className="flex gap-2.5 mt-4 pt-4 border-t border-border/40 shrink-0 items-center"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl cursor-pointer"
                  disabled={sending || uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Paperclip className="size-4" />
                  )}
                </Button>
                <Input
                  required={!uploading}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Reply to ${activeThread?.studentName || activeThreadEmail}…`}
                  className="h-11 bg-background flex-1 text-sm rounded-xl"
                  disabled={sending || uploading}
                />
                <Button type="submit" className="h-11 px-5 rounded-xl font-bold" disabled={sending || uploading}>
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Send
                      <Send className="size-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="bg-primary/5 rounded-full p-4 mb-4">
              <MessageSquare className="size-10 text-primary animate-pulse" />
            </div>
            <p className="text-base font-bold text-foreground">Select a conversation</p>
            <p className="text-xs max-w-[280px] mt-1.5 leading-relaxed">
              Choose a student/parent thread from the left pane to view message history and send replies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
