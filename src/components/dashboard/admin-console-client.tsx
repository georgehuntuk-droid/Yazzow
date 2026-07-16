"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Edit,
  Globe,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  updateTutorSubscriptionStatus,
  deleteTutorProfileAndUser,
  updateSupportTicketStatus,
  updateSupportTicketNotes,
  deleteSupportTicket,
  logoutAsAdmin,
  adminUpdateTutorProfile,
  createAdminNoticeAction,
  deleteAdminNoticeAction,
  replyToSupportTicketAction,
  clearTutorScheduleAction,
  toggleTutorBanStatus,
  toggleUserBanStatusAction,
  deleteUserAction,
  getTutorPaymentHistoryAction,
  sendAdminDirectMessageAction,
} from "@/lib/dashboard/admin-actions";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";

export type AdminTutorData = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  lessonPriceCents: number;
  currency: string;
  stripeAccountId: string | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  createdAt: string;
  lessonCount: number;
  lessonVolumeCents: number;
  resourceCount: number;
  resourceVolumeCents: number;
  paymentInstructions?: string | null;
  isBanned?: boolean;
  subscriptionTier?: string;
  stripeCustomerId?: string | null;
  lastLogin?: string | null;
  lessonsScheduledThisMonth?: number;
  isCalendarActive?: boolean;
  isStripeCompleted?: boolean;
  googleConnected?: boolean;
};

export type SupportTicket = {
  id: string;
  tutor_id: string | null;
  name: string;
  email: string;
  category: string;
  message: string;
  source: string;
  status: "open" | "resolved" | "closed";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminNotice = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

type AdminStudentData = {
  parentEmail: string;
  studentName: string;
};

export type AdminStudentAccountData = {
  email: string;
  studentNames: string[];
  id: string | null;
  createdAt: string | null;
  isBanned: boolean;
};

type AdminPendingUserData = {
  id: string;
  email: string;
  createdAt: string;
  name: string;
  isBanned?: boolean;
};

type AdminConsoleClientProps = {
  tutors: AdminTutorData[];
  platformStats?: unknown;
  isServiceRoleConfigured?: boolean;
  supportTickets: SupportTicket[];
  notices: AdminNotice[];
  studentsList?: AdminStudentData[];
  pendingOnboardingUsers?: AdminPendingUserData[];
  studentAccounts?: AdminStudentAccountData[];
};

export function AdminConsoleClient({ 
  tutors, 
  isServiceRoleConfigured = true, 
  supportTickets = [], 
  notices = [],
  studentsList = [],
  pendingOnboardingUsers = [],
  studentAccounts = []
}: AdminConsoleClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active_sub" | "no_sub" | "stripe_ok" | "stripe_missing">("all");
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Notice board states
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeContent, setNewNoticeContent] = useState("");
  const [isCreatingNotice, setIsCreatingNotice] = useState(false);

  // Ticket-specific states
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "resolved" | "closed">("open");
  const [closedTicketSearch, setClosedTicketSearch] = useState("");
  const [closedSubFilter, setClosedSubFilter] = useState<"all" | "resolved" | "closed">("all");
  const [editingNotesText, setEditingNotesText] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState<Record<string, string>>({});
  const [isReplyingId, setIsReplyingId] = useState<string | null>(null);
  const [pendingSearch, setPendingSearch] = useState("");

  // Edit Tutor-specific states
  const [editingTutor, setEditingTutor] = useState<AdminTutorData | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPaymentInstructions, setEditPaymentInstructions] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editSubscriptionTier, setEditSubscriptionTier] = useState("independent");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isClearingSchedule, setIsClearingSchedule] = useState(false);

  // Messaging-specific states
  const [messagingUser, setMessagingUser] = useState<{ email: string; name: string; tutorId?: string | null } | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [stripePayments, setStripePayments] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTutor) {
      setStripePayments([]);
      setPaymentsError(null);
      
      if (editingTutor.stripeCustomerId) {
        setIsLoadingPayments(true);
        getTutorPaymentHistoryAction(editingTutor.id)
          .then((res) => {
            if (res.ok && res.payments) {
              setStripePayments(res.payments);
            } else {
              setPaymentsError(res.error || "Failed to load payment history.");
            }
          })
          .catch((err) => {
            setPaymentsError(err instanceof Error ? err.message : "An error occurred.");
          })
          .finally(() => {
            setIsLoadingPayments(false);
          });
      }
    }
  }, [editingTutor]);

  const handleOpenEditModal = (tutor: AdminTutorData) => {
    setEditingTutor(tutor);
    setEditDisplayName(tutor.displayName);
    setEditUsername(tutor.username);
    setEditCurrency(tutor.currency);
    setEditPrice((tutor.lessonPriceCents / 100).toFixed(2));
    setEditPaymentInstructions(tutor.paymentInstructions ?? "");
    setEditAvatarUrl(tutor.avatarUrl ?? "");
    setEditSubscriptionTier(tutor.subscriptionTier ?? "independent");
  };

  const handleSaveTutorDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTutor) return;

    const priceFloat = parseFloat(editPrice);
    if (isNaN(priceFloat) || priceFloat < 0) {
      alert("Please enter a valid lesson price.");
      return;
    }

    const priceCents = Math.round(priceFloat * 100);
    const cleanUsername = editUsername.trim().toLowerCase();
    if (!cleanUsername) {
      alert("Username cannot be empty.");
      return;
    }

    setIsSavingDetails(true);
    try {
      const res = await adminUpdateTutorProfile(editingTutor.id, {
        displayName: editDisplayName.trim(),
        username: cleanUsername,
        currency: editCurrency.toLowerCase(),
        lessonPriceCents: priceCents,
        paymentInstructions: editPaymentInstructions.trim() || null,
        avatarUrl: editAvatarUrl.trim() || null,
        subscriptionTier: editSubscriptionTier,
      });

      if (res.ok) {
        setEditingTutor(null);
        router.refresh();
      } else {
        alert(`Failed to update tutor details: ${res.error}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving tutor details");
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!editingTutor) return;

    const confirmMsg = `WARNING: Are you absolutely sure you want to clear ${editingTutor.displayName}'s calendar schedule?\n\nThis will permanently delete all availability slots (both booked and unbooked) and cancel all bookings for this tutor. This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    setIsClearingSchedule(true);
    try {
      const res = await clearTutorScheduleAction(editingTutor.id);
      if (res.ok) {
        alert("Schedule cleared successfully!");
        setEditingTutor(null);
      } else {
        alert(`Failed to clear schedule: ${res.error}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error clearing schedule");
    } finally {
      setIsClearingSchedule(false);
    }
  };

  const handleUpdateTicketStatus = (ticketId: string, status: "open" | "resolved" | "closed") => {
    setActionLoadingId(ticketId);
    startTransition(async () => {
      try {
        const res = await updateSupportTicketStatus(ticketId, status);
        if (!res.ok) alert(`Failed to update ticket status: ${res.error}`);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error updating status");
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleSaveTicketNotes = async (ticketId: string) => {
    const text = editingNotesText[ticketId];
    if (text === undefined) return;
    setSavingNotesId(ticketId);
    try {
      const res = await updateSupportTicketNotes(ticketId, text);
      if (!res.ok) alert(`Failed to save notes: ${res.error}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving notes");
    } finally {
      setSavingNotesId(null);
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (!confirm("Are you sure you want to permanently delete this support ticket?")) return;
    setActionLoadingId(ticketId);
    startTransition(async () => {
      try {
        const res = await deleteSupportTicket(ticketId);
        if (!res.ok) alert(`Failed to delete ticket: ${res.error}`);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error deleting ticket");
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleSendTicketReply = async (ticket: SupportTicket) => {
    const text = ticketReplyText[ticket.id]?.trim();
    if (!text) return;

    setIsReplyingId(ticket.id);
    try {
      const res = await replyToSupportTicketAction({
        ticketId: ticket.id,
        name: ticket.name,
        email: ticket.email,
        category: ticket.category,
        originalMessage: ticket.message,
        replyMessage: text,
      });

      if (res.ok) {
        setTicketReplyText(prev => ({ ...prev, [ticket.id]: "" }));
        alert("Reply sent successfully via email!");
      } else {
        alert(`Failed to send reply: ${res.error}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error sending reply");
    } finally {
      setIsReplyingId(null);
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;

    setIsCreatingNotice(true);
    try {
      const res = await createAdminNoticeAction(newNoticeTitle, newNoticeContent);
      if (res.ok) {
        setNewNoticeTitle("");
        setNewNoticeContent("");
      } else {
        alert(`Failed to publish notice: ${res.error}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error creating notice");
    } finally {
      setIsCreatingNotice(false);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
      const res = await deleteAdminNoticeAction(noticeId);
      if (!res.ok) {
        alert(`Failed to delete notice: ${res.error}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting notice");
    }
  };

  // Search and filter logic
  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch =
      tutor.displayName.toLowerCase().includes(search.toLowerCase()) ||
      tutor.username.toLowerCase().includes(search.toLowerCase()) ||
      tutor.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    const hasActiveSub = tutor.subscriptionStatus === "active" || tutor.subscriptionStatus === "trialing";

    if (filter === "active_sub") return hasActiveSub;
    if (filter === "no_sub") return !hasActiveSub;
    if (filter === "stripe_ok") return tutor.stripeAccountId !== null;
    if (filter === "stripe_missing") return tutor.stripeAccountId === null;

    return true;
  });

  const handleCompSubscription = (tutorId: string, currentStatus: string | null) => {
    const nextStatus = currentStatus === "active" ? "none" : "active";
    const confirmMsg =
      nextStatus === "active"
        ? "Are you sure you want to comp/grant an active subscription to this tutor?"
        : "Are you sure you want to cancel this tutor's active subscription status?";

    if (!confirm(confirmMsg)) return;

    setActionLoadingId(tutorId);
    startTransition(async () => {
      try {
        const res = await updateTutorSubscriptionStatus(tutorId, nextStatus);
        if (!res.ok) {
          alert(`Failed to update subscription: ${res.error}`);
        }
      } catch (err) {
        alert(`An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleToggleBan = (tutorId: string, isBanned: boolean) => {
    const actionName = isBanned ? "unban" : "ban";
    if (!confirm(`Are you sure you want to ${actionName} this tutor account?`)) return;

    setActionLoadingId(tutorId);
    startTransition(async () => {
      try {
        const res = await toggleTutorBanStatus(tutorId, !isBanned);
        if (!res.ok) {
          alert(`Failed to ${actionName} tutor: ${res.error}`);
        }
      } catch (err) {
        alert(`An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleDeleteTutor = (tutorId: string, displayName: string) => {
    if (
      !confirm(
        `CRITICAL WARNING: Are you absolutely sure you want to delete ${displayName}'s account?\n\nThis will completely delete their tutor profile, custom availability slots, all digital worksheet packs, client ledger entries, and their registered authentication account. This action is permanent and cannot be undone.`
      )
    ) {
      return;
    }

    setActionLoadingId(tutorId);
    startTransition(async () => {
      try {
        const res = await deleteTutorProfileAndUser(tutorId);
        if (!res.ok) {
          alert(`Failed to delete tutor: ${res.error}`);
        }
      } catch (err) {
        alert(`An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleToggleUserBan = (email: string, isBanned: boolean) => {
    const actionName = isBanned ? "unban" : "ban";
    if (!confirm(`Are you sure you want to ${actionName} this user account?`)) return;

    setActionLoadingId(email);
    startTransition(async () => {
      try {
        const res = await toggleUserBanStatusAction(email, !isBanned);
        if (!res.ok) {
          alert(`Failed to ${actionName} user: ${res.error}`);
        }
      } catch (err) {
        alert(`An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleDeleteUser = (userId: string | null, email: string) => {
    if (
      !confirm(
        `CRITICAL WARNING: Are you absolutely sure you want to delete ${email}'s account?\n\nThis will completely delete all student profiles, bookings, and their registered authentication account. This action is permanent and cannot be undone.`
      )
    ) {
      return;
    }

    setActionLoadingId(userId || email);
    startTransition(async () => {
      try {
        const res = await deleteUserAction(userId, email);
        if (!res.ok) {
          alert(`Failed to delete user: ${res.error}`);
        }
      } catch (err) {
        alert(`An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "—";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Open tickets search filter
  const filteredOpenTickets = supportTickets
    .filter((t) => t.status === "open")
    .filter((ticket) => {
      const matchesSearch =
        ticket.name.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        ticket.email.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        ticket.message.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        (ticket.admin_notes && ticket.admin_notes.toLowerCase().includes(ticketSearch.toLowerCase()));
      return matchesSearch;
    });

  // Closed/Resolved tickets search and sub-filter
  const filteredClosedTickets = supportTickets
    .filter((t) => t.status === "resolved" || t.status === "closed")
    .filter((ticket) => {
      const matchesSearch =
        ticket.name.toLowerCase().includes(closedTicketSearch.toLowerCase()) ||
        ticket.email.toLowerCase().includes(closedTicketSearch.toLowerCase()) ||
        ticket.message.toLowerCase().includes(closedTicketSearch.toLowerCase()) ||
        (ticket.admin_notes && ticket.admin_notes.toLowerCase().includes(closedTicketSearch.toLowerCase()));

      if (!matchesSearch) return false;
      if (closedSubFilter !== "all" && ticket.status !== closedSubFilter) return false;
      return true;
    });

  // Pending Onboarding users filter
  const filteredPending = pendingOnboardingUsers.filter((u) => {
    return (
      u.email.toLowerCase().includes(pendingSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(pendingSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(pendingSearch.toLowerCase())
    );
  });

  // Student Accounts filter
  const filteredStudents = (studentAccounts ?? []).filter((s) => {
    const term = studentSearch.toLowerCase();
    return (
      s.email.toLowerCase().includes(term) ||
      s.studentNames.some((name) => name.toLowerCase().includes(term)) ||
      (s.id && s.id.toLowerCase().includes(term))
    );
  });

  const renderTicketCard = (ticket: SupportTicket) => {
    const isLoading = actionLoadingId === ticket.id && isPending;
    const draftNotes = editingNotesText[ticket.id] ?? ticket.admin_notes ?? "";
    const isNotesSaving = savingNotesId === ticket.id;
    const matchedTutor = tutors.find(
      (t) => t.email.toLowerCase() === ticket.email.toLowerCase()
    );
    const matchedStudent = !matchedTutor && (studentsList ?? []).find(
      (s) => s.parentEmail.toLowerCase() === ticket.email.toLowerCase()
    );

    return (
      <Card key={ticket.id} className="yazz-surface">
        <CardContent className="p-6 space-y-4">
          {/* Ticket header row */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/40 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base text-foreground leading-none">
                  {ticket.name}
                </h3>
                <span className="text-xs text-muted-foreground">({ticket.email})</span>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                  {ticket.category}
                </Badge>
                {matchedTutor && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[9px] uppercase font-bold py-0 h-4.5 px-1.5 rounded">
                    Tutor
                  </Badge>
                )}
                {matchedStudent && (
                  <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/10 text-[9px] uppercase font-bold py-0 h-4.5 px-1.5 rounded">
                    Student/Parent
                  </Badge>
                )}
                {!matchedTutor && !matchedStudent && (
                  <Badge variant="outline" className="text-muted-foreground text-[9px] uppercase font-bold py-0 h-4.5 px-1.5 rounded">
                    Guest/Visitor
                  </Badge>
                )}
                <Badge 
                  className={cn(
                    "text-[10px] font-bold",
                    ticket.status === "open" && "bg-blue-500/10 text-blue-600 hover:bg-blue-500/10",
                    ticket.status === "resolved" && "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10",
                    ticket.status === "closed" && "bg-muted text-muted-foreground hover:bg-muted"
                  )}
                >
                  {ticket.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Submitted: <span className="font-medium text-foreground">{formatDate(ticket.created_at)}</span> from <span className="font-semibold">{ticket.source}</span>
              </p>
              {matchedTutor && (
                <div className="flex items-center gap-2.5 flex-wrap pt-1">
                  <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary hover:bg-primary/10 font-bold py-0 h-4.5 px-1.5 rounded">
                    Tutor Account Matched
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(matchedTutor)}
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="size-3" /> Audit/Inspect Account
                  </button>
                  <Link
                    href={`/tutor/${matchedTutor.username}`}
                    target="_blank"
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Globe className="size-3" /> View Portal
                  </Link>
                </div>
              )}
              {matchedStudent && (
                <div className="flex items-center gap-2.5 flex-wrap pt-1">
                  <Badge variant="secondary" className="text-[9px] bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 font-bold py-0 h-4.5 px-1.5 rounded">
                    Student Matches Parent: {matchedStudent.studentName}
                  </Badge>
                </div>
              )}
            </div>

            {/* Status toggles & Delete button */}
            <div className="flex items-center gap-1.5">
              {ticket.status !== "resolved" && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={isLoading}
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  onClick={() => handleUpdateTicketStatus(ticket.id, "resolved")}
                >
                  Mark Resolved
                </Button>
              )}
              {ticket.status !== "closed" && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={isLoading}
                  className="bg-muted text-muted-foreground border-border hover:bg-muted/60"
                  onClick={() => handleUpdateTicketStatus(ticket.id, "closed")}
                >
                  Close
                </Button>
              )}
              {(ticket.status === "resolved" || ticket.status === "closed") && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={isLoading}
                  className="border-primary/20 text-primary bg-primary/5 hover:bg-primary/10"
                  onClick={() => handleUpdateTicketStatus(ticket.id, "open")}
                >
                  Re-open Ticket
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className="size-8 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteTicket(ticket.id)}
                aria-label="Delete ticket"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          {/* Ticket message body */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Message</p>
            <div className="whitespace-pre-wrap text-sm text-foreground bg-muted/30 p-4 rounded-xl border border-border/40 italic leading-relaxed">
              &ldquo;{ticket.message}&rdquo;
            </div>
          </div>

          {/* Ticket Admin Notes section */}
          <div className="space-y-2 border-t border-border/40 pt-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              Internal Admin Notes / Resolutions
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <textarea
                value={draftNotes}
                onChange={(e) => setEditingNotesText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                placeholder="Add notes about support resolution, followups, or actions taken..."
                className="flex min-h-16 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button
                type="button"
                size="xs"
                disabled={isNotesSaving || draftNotes === (ticket.admin_notes ?? "")}
                className="self-end sm:self-auto sm:h-16 rounded-lg text-xs font-bold"
                onClick={() => handleSaveTicketNotes(ticket.id)}
              >
                {isNotesSaving ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>

          {/* Reply to Customer section */}
          <div className="space-y-2 border-t border-border/40 pt-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              Reply to Customer (Will email them directly)
            </label>
            <div className="flex flex-col gap-2.5">
              <textarea
                value={ticketReplyText[ticket.id] ?? ""}
                onChange={(e) => setTicketReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                placeholder="Write your email response back to the customer... Ticket ID will be quoted automatically."
                className="flex min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button
                type="button"
                size="sm"
                disabled={isReplyingId === ticket.id || !(ticketReplyText[ticket.id]?.trim())}
                className="self-start gap-1.5 font-semibold text-white bg-primary hover:bg-primary/90"
                onClick={() => handleSendTicketReply(ticket)}
              >
                {isReplyingId === ticket.id ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Sending Reply...
                  </>
                ) : (
                  <>
                    <Mail className="size-3.5" />
                    Send Email Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Tabs defaultValue="tutors" className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <TabsList className="h-11 w-full justify-start rounded-xl bg-muted/60 p-1 sm:w-auto">
          <TabsTrigger value="tutors" className="rounded-lg px-4 font-semibold">
            Tutor Directory ({tutors.length})
          </TabsTrigger>
          <TabsTrigger value="tickets" className="rounded-lg px-4 font-semibold">
            Open Tickets ({supportTickets.filter(t => t.status === "open").length})
          </TabsTrigger>
          <TabsTrigger value="closed_tickets" className="rounded-lg px-4 font-semibold">
            Closed Tickets ({supportTickets.filter(t => t.status === "resolved" || t.status === "closed").length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg px-4 font-semibold">
            Pending Onboarding ({pendingOnboardingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="students" className="rounded-lg px-4 font-semibold">
            Student Accounts ({studentAccounts.length})
          </TabsTrigger>
          <TabsTrigger value="notices" className="rounded-lg px-4 font-semibold">
            Notice Board ({notices.length})
          </TabsTrigger>
        </TabsList>

        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const res = await logoutAsAdmin();
            if (res.ok) {
              window.location.href = "/dashboard";
            }
          }}
          className="h-10 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950/40 dark:text-red-400 dark:hover:bg-red-950/20"
        >
          Exit Admin Mode
        </Button>
      </div>

      <TabsContent value="tutors" className="space-y-6 outline-none">
        <div className="space-y-8">
          {!isServiceRoleConfigured && (
            <Card className="border-amber-200 bg-amber-50/50 p-5 shadow-sm">
              <p className="font-bold text-amber-900 flex items-center gap-1.5 text-sm sm:text-base">
                <AlertTriangle className="size-5 text-amber-600 shrink-0" />
                Service Role Key Missing (Read-Only Mode)
              </p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-amber-800 leading-relaxed">
                The platform is running without the <strong>SUPABASE_SERVICE_ROLE_KEY</strong> or <strong>SUPABASE_SECRET_KEY</strong> environment variable. You can view registered tutors, but all write operations (like Compping subscriptions, Un-compping, or deleting users) will be blocked by Supabase Row Level Security (RLS).
              </p>
              <p className="mt-2 text-xs sm:text-sm font-semibold text-amber-800">
                Fix: Go to Vercel → Project Settings → Environment Variables, add <code>SUPABASE_SERVICE_ROLE_KEY</code> (copy the secret service_role key from your Supabase Dashboard → Project Settings → API), and trigger a fresh deployment.
              </p>
            </Card>
          )}

          {/* Search & Tabs bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tutors by name, username, or email..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All ({tutors.length})
              </Button>
              <Button
                variant={filter === "active_sub" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active_sub")}
              >
                Subscribed ({tutors.filter((t) => t.subscriptionStatus === "active" || t.subscriptionStatus === "trialing").length})
              </Button>
              <Button
                variant={filter === "no_sub" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("no_sub")}
              >
                Not Subscribed ({tutors.filter((t) => t.subscriptionStatus !== "active" && t.subscriptionStatus !== "trialing").length})
              </Button>
              <Button
                variant={filter === "stripe_ok" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("stripe_ok")}
              >
                Stripe Connected ({tutors.filter((t) => t.stripeAccountId !== null).length})
              </Button>
              <Button
                variant={filter === "stripe_missing" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("stripe_missing")}
              >
                Stripe Missing ({tutors.filter((t) => t.stripeAccountId === null).length})
              </Button>
            </div>
          </div>

          {/* Tutor directory list */}
          <div className="space-y-4">
            {filteredTutors.length === 0 ? (
              <Card className="yazz-surface border-dashed p-10 text-center">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">No tutors match your search/filters.</p>
                </CardContent>
              </Card>
            ) : (
              filteredTutors.map((tutor) => {
                const hasActiveSub = tutor.subscriptionStatus === "active" || tutor.subscriptionStatus === "trialing";
                const isLoading = actionLoadingId === tutor.id && isPending;

                // Calculate Churn Risk: paying subscription and inactive for > 14 days
                const lastActiveDate = tutor.lastLogin ? new Date(tutor.lastLogin) : null;
                const isInactiveOver14 = lastActiveDate 
                  ? (Date.now() - lastActiveDate.getTime()) > 14 * 24 * 60 * 60 * 1000 
                  : true; // Treat never logged in as inactive
                const isChurnRisk = hasActiveSub && isInactiveOver14;

                // Previous resolved tickets for this tutor/user
                const resolvedTutorTickets = supportTickets.filter(
                  (ticket) =>
                    (ticket.tutor_id === tutor.id || ticket.email.toLowerCase() === tutor.email.toLowerCase()) &&
                    (ticket.status === "resolved" || ticket.status === "closed")
                );

                return (
                  <Card
                    key={tutor.id}
                    className={cn(
                      "yazz-surface transition-all relative overflow-hidden",
                      isChurnRisk
                        ? "border-red-200 bg-red-50/20 dark:border-red-950/40 dark:bg-red-950/5 shadow-[0_0_12px_rgba(239,68,68,0.06)]"
                        : hasActiveSub
                          ? "border-emerald-100 dark:border-emerald-950/40"
                          : "border-border/60"
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        {/* Tutor info */}
                        <div className="flex items-start gap-4">
                          {tutor.avatarUrl ? (
                            <img
                              src={tutor.avatarUrl}
                              alt={tutor.displayName}
                              className="size-12 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                              {tutor.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-heading text-lg font-semibold leading-none text-foreground">
                                {tutor.displayName}
                              </h3>
                              <Badge variant="outline" className="font-mono text-xs">
                                @{tutor.username}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="size-3.5 shrink-0" />
                              <span>{tutor.email}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Registered: <span className="font-medium text-foreground">{formatDate(tutor.createdAt)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-y border-border/40 py-4 sm:grid-cols-3 lg:grid-cols-4 lg:border-y-0 lg:py-0 min-w-0 flex-1 lg:max-w-xl">
                          <div>
                            <p className="text-xs text-muted-foreground">Lesson Vol (30d)</p>
                            <p className="text-sm font-bold text-foreground">{formatMoney(tutor.lessonVolumeCents, tutor.currency)}</p>
                            <p className="text-[10px] text-muted-foreground">{tutor.lessonCount} booking{tutor.lessonCount === 1 ? "" : "s"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Scheduled (Mo)</p>
                            <p className="text-sm font-bold text-foreground">{tutor.lessonsScheduledThisMonth ?? 0}</p>
                            <p className="text-[10px] text-muted-foreground">This Calendar Month</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Last Login</p>
                            <p className="text-sm font-bold text-foreground">
                              {tutor.lastLogin ? new Date(tutor.lastLogin).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Never"}
                            </p>
                            {tutor.lastLogin && (
                              <p className="text-[10px] text-muted-foreground">
                                {Math.max(0, Math.floor((Date.now() - new Date(tutor.lastLogin).getTime()) / (1000 * 3600 * 24)))} days ago
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Pricing Rate</p>
                            <p className="text-sm font-medium text-foreground">
                              {formatMoney(tutor.lessonPriceCents, tutor.currency)}/hr
                            </p>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col gap-4 w-full lg:w-80 shrink-0 items-end lg:items-start self-stretch lg:self-start justify-between">
                          <div className="flex flex-wrap gap-1.5 justify-end lg:justify-start">
                            {/* Stripe Connect Badge */}
                          {tutor.stripeAccountId ? (
                            tutor.isStripeCompleted ? (
                              <Badge className="gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold">
                                <CheckCircle className="size-3.5 text-emerald-500" />
                                Stripe: Active
                              </Badge>
                            ) : (
                              <Badge className="gap-1 bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 font-bold">
                                <AlertTriangle className="size-3.5 text-amber-500" />
                                Stripe: Incomplete
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="gap-1 text-muted-foreground border-border/80 bg-muted/20">
                              <XCircle className="size-3.5" />
                              Stripe: Missing
                            </Badge>
                          )}

                          {/* Calendar Sync Integration Badge */}
                          {tutor.isCalendarActive ? (
                            <Badge className="gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold">
                              <CheckCircle className="size-3.5 text-emerald-500" />
                              Calendar: Synced
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-muted-foreground border-border/80 bg-muted/20">
                              <XCircle className="size-3.5" />
                              Calendar: Missing
                            </Badge>
                          )}

                          {/* Churn Risk Indicator */}
                          {isChurnRisk && (
                            <Badge className="gap-1 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 font-extrabold hover:bg-red-500/10 animate-pulse">
                              <AlertTriangle className="size-3.5 text-red-500" />
                              ⚠️ CHURN RISK (Inactive &gt; 14d)
                            </Badge>
                          )}

                          {/* Subscription Badge */}
                           {/* Tier Badge */}
                           {(() => {
                             const tier = tutor.subscriptionTier || "independent";
                             if (tier === "academy" || tier === "agency") {
                               return (
                                 <Badge className="gap-1 bg-yellow-500/10 border border-yellow-500/25 text-yellow-700 dark:text-yellow-400 font-extrabold hover:bg-yellow-500/10">
                                   🏫 Academy
                                 </Badge>
                               );
                             }
                             return (
                               <Badge className="gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-500 font-semibold hover:bg-blue-500/10">
                                 🎓 Independent
                               </Badge>
                             );
                           })()}

                           {/* Active/Inactive Billing Status */}
                            {tutor.subscriptionStatus === "trialing" ? (
                              (() => {
                                const isExpired = tutor.subscriptionCurrentPeriodEnd
                                  ? new Date(tutor.subscriptionCurrentPeriodEnd).getTime() < Date.now()
                                  : false;
                                if (isExpired) {
                                  return (
                                    <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10 font-bold">
                                      <XCircle className="size-3.5" />
                                      Trial Expired
                                    </Badge>
                                  );
                                } else {
                                  const daysLeft = tutor.subscriptionCurrentPeriodEnd
                                    ? Math.max(0, Math.ceil((new Date(tutor.subscriptionCurrentPeriodEnd).getTime() - Date.now()) / (1000 * 3600 * 24)))
                                    : 14;
                                  return (
                                    <Badge className="gap-1 bg-blue-500/10 border border-blue-500/25 text-blue-700 dark:text-blue-400 font-bold hover:bg-blue-500/10">
                                      <Sparkles className="size-3.5 animate-pulse" />
                                      Trialing ({daysLeft}d left)
                                    </Badge>
                                  );
                                }
                              })()
                            ) : hasActiveSub ? (
                              <Badge className="gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10">
                                <ShieldCheck className="size-3.5" />
                                Active billing
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-muted-foreground">
                                <XCircle className="size-3.5" />
                                No active billing
                              </Badge>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap items-center gap-1.5 justify-end lg:justify-start w-full pt-3 border-t border-border/40">
                            {/* Impersonation Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition"
                              disabled={isPending}
                              onClick={async () => {
                                const { startImpersonationAction } = await import("@/lib/dashboard/admin-actions");
                                startTransition(async () => {
                                  await startImpersonationAction(tutor.id);
                                  window.location.href = "/dashboard";
                                });
                              }}
                            >
                              <ShieldAlert className="size-3.5" />
                              Impersonate
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-medium"
                              render={<Link href={`/tutor/${tutor.username}`} target="_blank" />}
                            >
                              <Globe className="size-3.5" />
                              View Portal
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-medium gap-1"
                              onClick={() => setMessagingUser({
                                email: tutor.email,
                                name: tutor.displayName,
                                tutorId: tutor.id
                              })}
                            >
                              <Mail className="size-3.5" />
                              Message
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-medium"
                              onClick={() => handleOpenEditModal(tutor)}
                            >
                              <Edit className="size-3.5" />
                              Edit Details
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleCompSubscription(tutor.id, tutor.subscriptionStatus)}
                              className="h-8 text-xs font-medium"
                            >
                              {isLoading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : hasActiveSub ? (
                                "Un-Comp"
                              ) : (
                                "Comp Sub"
                              )}
                            </Button>

                            <Button
                              variant={tutor.isBanned ? "default" : "outline"}
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleToggleBan(tutor.id, !!tutor.isBanned)}
                              className={cn(
                                "h-8 text-xs font-medium cursor-pointer",
                                tutor.isBanned 
                                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600" 
                                  : "text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                              )}
                            >
                              {isLoading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : tutor.isBanned ? (
                                "Unban"
                              ) : (
                                "Ban"
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleDeleteTutor(tutor.id, tutor.displayName)}
                              className="h-8 size-8 p-0 text-destructive hover:bg-destructive/10"
                            >
                              {isLoading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Previous Resolved Tickets section */}
                      {resolvedTutorTickets.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Previous Resolved Tickets ({resolvedTutorTickets.length})
                          </p>
                          <div className="grid gap-2.5 sm:grid-cols-2">
                            {resolvedTutorTickets.map((ticket) => (
                              <div
                                key={ticket.id}
                                className="text-xs p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1.5 animate-in fade-in-50 duration-200"
                              >
                                <div className="flex justify-between items-center flex-wrap gap-1">
                                  <span className="font-semibold text-foreground">{ticket.category}</span>
                                  <div className="flex items-center gap-1.5">
                                    <Badge 
                                      className={cn(
                                        "text-[9px] font-bold py-0 h-4 px-1.5",
                                        ticket.status === "resolved" && "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10",
                                        ticket.status === "closed" && "bg-muted text-muted-foreground hover:bg-muted"
                                      )}
                                    >
                                      {ticket.status}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{formatDate(ticket.created_at)}</span>
                                  </div>
                                </div>
                                <p className="italic text-muted-foreground line-clamp-2 leading-relaxed">
                                  &ldquo;{ticket.message}&rdquo;
                                </p>
                                {ticket.admin_notes && (
                                  <p className="text-[10px] text-primary/80 font-medium bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                                    <strong>Admin Note:</strong> {ticket.admin_notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="tickets" className="space-y-6 outline-none">
        <div className="space-y-6">
          {/* Tickets Search & Filtering */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search open tickets by name, email, message..."
                className="pl-10"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Tickets Listing */}
          <div className="space-y-4">
            {filteredOpenTickets.length === 0 ? (
              <Card className="yazz-surface border-dashed p-10 text-center">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">No open support tickets match your search.</p>
                </CardContent>
              </Card>
            ) : (
              filteredOpenTickets.map((ticket) => renderTicketCard(ticket))
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="closed_tickets" className="space-y-6 outline-none">
        <div className="space-y-6">
          {/* Closed Tickets Search & Filtering */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search closed/resolved tickets by name, email, message..."
                className="pl-10"
                value={closedTicketSearch}
                onChange={(e) => setClosedTicketSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={closedSubFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setClosedSubFilter("all")}
              >
                All Closed/Resolved ({supportTickets.filter(t => t.status === "resolved" || t.status === "closed").length})
              </Button>
              <Button
                variant={closedSubFilter === "resolved" ? "default" : "outline"}
                size="sm"
                onClick={() => setClosedSubFilter("resolved")}
              >
                Resolved ({supportTickets.filter(t => t.status === "resolved").length})
              </Button>
              <Button
                variant={closedSubFilter === "closed" ? "default" : "outline"}
                size="sm"
                onClick={() => setClosedSubFilter("closed")}
              >
                Closed ({supportTickets.filter(t => t.status === "closed").length})
              </Button>
            </div>
          </div>

          {/* Tickets Listing */}
          <div className="space-y-4">
            {filteredClosedTickets.length === 0 ? (
              <Card className="yazz-surface border-dashed p-10 text-center">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">No closed/resolved support tickets match your search/filters.</p>
                </CardContent>
              </Card>
            ) : (
              filteredClosedTickets.map((ticket) => renderTicketCard(ticket))
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="pending" className="space-y-6 outline-none">
        <div className="space-y-6">
          {/* Pending Onboarding Search */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search registered users by email or user ID..."
                className="pl-10"
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Pending Users Listing */}
          <div className="space-y-4">
            {filteredPending.length === 0 ? (
              <Card className="yazz-surface border-dashed p-10 text-center">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">No pre-onboarded/pending onboarding users match your search.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="min-w-full divide-y divide-border text-sm leading-normal">
                  <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3.5 text-left">User Profile</th>
                      <th className="px-6 py-3.5 text-left">Registered At</th>
                      <th className="px-6 py-3.5 text-left">Supabase Auth ID</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground font-medium bg-card">
                    {filteredPending.map((user) => {
                      const isLoading = actionLoadingId === user.id && isPending;
                      return (
                        <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded select-all font-mono">
                              {user.id}
                            </code>
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => setMessagingUser({
                                email: user.email,
                                name: user.name,
                                tutorId: user.id
                              })}
                              className="h-7 px-2.5 text-[11px] font-semibold gap-1 rounded-lg"
                            >
                              <Mail className="size-3" />
                              Message
                            </Button>

                            <Button
                              variant={user.isBanned ? "default" : "outline"}
                              size="xs"
                              disabled={isLoading}
                              onClick={() => handleToggleUserBan(user.email, !!user.isBanned)}
                              className={cn(
                                "h-7 px-2.5 text-[11px] font-medium cursor-pointer rounded-lg",
                                user.isBanned 
                                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600" 
                                  : "text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                              )}
                            >
                              {isLoading ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : user.isBanned ? (
                                "Unban"
                              ) : (
                                "Ban"
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                              title="Delete user completely"
                            >
                              {isLoading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="students" className="space-y-6 outline-none">
        <div className="space-y-6">
          {/* Search bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students by parent email, student name, or ID..."
                className="pl-10"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Students Accounts list */}
          <div className="space-y-4">
            {filteredStudents.length === 0 ? (
              <Card className="yazz-surface border-dashed p-10 text-center">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">No student/parent accounts match your search.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="min-w-full divide-y divide-border text-sm leading-normal">
                  <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3.5 text-left">Parent Email</th>
                      <th className="px-6 py-3.5 text-left">Students</th>
                      <th className="px-6 py-3.5 text-left">Supabase Auth ID</th>
                      <th className="px-6 py-3.5 text-left">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground font-medium bg-card">
                    {filteredStudents.map((account) => {
                      const isLoading = actionLoadingId === (account.id || account.email) && isPending;
                      return (
                        <tr key={account.email} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold">{account.email}</div>
                            {account.createdAt && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                Registered: {formatDate(account.createdAt)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {account.studentNames.map((name) => (
                                <Badge key={name} variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {account.id ? (
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded select-all font-mono">
                                {account.id}
                              </code>
                            ) : (
                              <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded font-semibold border border-amber-500/20">
                                Not Registered (Invite Pending)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {account.isBanned ? (
                              <Badge variant="destructive" className="font-bold text-[10px]">Banned</Badge>
                            ) : (
                              <Badge variant="outline" className="font-bold text-[10px] text-green-600 border-green-200 bg-green-50/50">Active</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => setMessagingUser({
                                email: account.email,
                                name: account.studentNames[0] ? `${account.studentNames.join(" & ")}'s Parent` : "Parent",
                                tutorId: account.id
                              })}
                              className="h-7 px-2.5 text-[11px] font-semibold gap-1 rounded-lg"
                            >
                              <Mail className="size-3" />
                              Message
                            </Button>

                            <Button
                              variant={account.isBanned ? "default" : "outline"}
                              size="xs"
                              disabled={isLoading}
                              onClick={() => handleToggleUserBan(account.email, account.isBanned)}
                              className={cn(
                                "h-7 px-2.5 text-[11px] font-medium cursor-pointer rounded-lg",
                                account.isBanned 
                                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600" 
                                  : "text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                              )}
                            >
                              {isLoading ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : account.isBanned ? (
                                "Unban"
                              ) : (
                                "Ban"
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleDeleteUser(account.id, account.email)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                              title="Delete student and auth account completely"
                            >
                              {isLoading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="notices" className="space-y-6 outline-none">
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          {/* Create notice form */}
          <Card className="yazz-surface p-6 self-start bg-card/50">
            <h3 className="text-base font-black text-foreground mb-4">Post a New Announcement</h3>
            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Title</label>
                <Input
                  required
                  placeholder="e.g. New drag-and-drop schedule features!"
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  className="rounded-lg text-sm bg-background border-border/80 text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Announcement Text</label>
                <textarea
                  required
                  placeholder="Describe the new feature or type a message to all tutors..."
                  value={newNoticeContent}
                  onChange={(e) => setNewNoticeContent(e.target.value)}
                  className="flex min-h-36 w-full resize-y rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-foreground"
                />
              </div>
              <Button
                type="submit"
                disabled={isCreatingNotice}
                className="w-full text-white bg-primary hover:bg-primary/90 font-bold rounded-lg"
              >
                {isCreatingNotice ? "Publishing..." : "Publish Announcement"}
              </Button>
            </form>
          </Card>

          {/* List existing notices */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground">Announcements History</h3>
              <p className="text-xs text-muted-foreground">These posts are visible to all tutors on their main dashboard page.</p>
            </div>
            
            <div className="space-y-4">
              {notices.length === 0 ? (
                <Card className="yazz-surface p-8 text-center text-muted-foreground bg-card/30 border border-dashed">
                  <p className="text-sm font-semibold">No announcements posted yet</p>
                  <p className="text-xs mt-1">Use the form on the left to write your first message to tutors.</p>
                </Card>
              ) : (
                notices.map((notice) => (
                  <Card key={notice.id} className="yazz-surface p-5 relative group overflow-hidden bg-card/60">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {(() => {
                            if (!notice.created_at) return "—";
                            const d = new Date(notice.created_at);
                            if (isNaN(d.getTime())) return "—";
                            return d.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            });
                          })()}
                        </span>
                        <h4 className="text-base font-black text-foreground mt-1 select-all">{notice.title}</h4>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="size-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground/90 whitespace-pre-wrap mt-3 leading-relaxed">
                      {notice.content}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Edit Tutor Modal */}
      {editingTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Edit Tutor: {editingTutor.displayName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTutor(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTutorDetails} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 pb-2">
              <div className="space-y-1">
                <label htmlFor="edit-display-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Display Name
                </label>
                <Input
                  id="edit-display-name"
                  required
                  placeholder="e.g. Jane Doe"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Username
                </label>
                <Input
                  id="edit-username"
                  required
                  placeholder="e.g. janedoe"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                />
                <p className="text-[10px] text-muted-foreground">
                  Lowercase, letters, numbers, hyphens, and underscores only.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-avatar-url" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Avatar / Profile Photo URL
                </label>
                <div className="flex gap-3 items-center">
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt="Avatar Preview" className="size-10 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      No Pic
                    </div>
                  )}
                  <Input
                    id="edit-avatar-url"
                    placeholder="https://... / public image url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="flex-1"
                  />
                  {editAvatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setEditAvatarUrl("")}
                      className="text-destructive hover:bg-destructive/10 text-xs font-semibold px-2 h-9 rounded-lg"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="edit-currency" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Currency
                  </label>
                  <select
                    id="edit-currency"
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 text-foreground"
                  >
                    {SUPPORTED_CURRENCIES.map((code) => (
                      <option key={code} value={code}>
                        {code.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-price" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lesson Price / hr
                  </label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="25.00"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-payment-instructions" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment Instructions
                </label>
                <textarea
                  id="edit-payment-instructions"
                  placeholder="Add custom bank details, Stripe info, or general offline billing instructions..."
                  value={editPaymentInstructions}
                  onChange={(e) => setEditPaymentInstructions(e.target.value)}
                  className="flex min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 text-foreground"
                />
              </div>

              {/* Platform & Billing Audit Section */}
              <div className="mt-4 pt-4 border-t border-border/40 space-y-3 bg-muted/20 p-4 rounded-xl border border-border/30">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                  <span>Platform & Billing Audit</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isClearingSchedule || isSavingDetails}
                    onClick={handleClearSchedule}
                    className="border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold h-7 px-2.5 rounded-lg shrink-0 cursor-pointer"
                  >
                    {isClearingSchedule ? "Clearing..." : "Clear Schedule (Cancel slots/bookings)"}
                  </Button>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs leading-normal">
                  <div>
                    <p className="text-muted-foreground font-medium">Subscription State</p>
                    <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      {editingTutor.subscriptionStatus === "active" || editingTutor.subscriptionStatus === "trialing" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="size-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600">
                          <XCircle className="size-3.5" /> Inactive
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Billing Period End</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {formatDate(editingTutor.subscriptionCurrentPeriodEnd)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground font-medium mb-1.5">Subscription Tier</p>
                    <select
                      value={editSubscriptionTier}
                      onChange={(e) => setEditSubscriptionTier(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 text-foreground"
                    >
                      <option value="independent">🎓 The Independent (£29/mo - Unlimited students)</option>
                      <option value="academy">🏫 The Academy (£79/mo - Multi-tutor & Branding)</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Lesson volume (Gross)</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {formatMoney(editingTutor.lessonVolumeCents, editingTutor.currency)} ({editingTutor.lessonCount} bookings)
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Storefront volume (Gross)</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {formatMoney(editingTutor.resourceVolumeCents, editingTutor.currency)} ({editingTutor.resourceCount} downloads)
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground font-medium">Stripe connected account ID</p>
                    <p className="font-mono text-[10px] text-foreground bg-background p-2 rounded-lg border border-border/60 select-all mt-1.5">
                      {editingTutor.stripeAccountId || "Not Connected"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stripe Membership Payments History */}
              <div className="border-t border-border/40 pt-5 mt-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
                  <CreditCard className="size-3.5" />
                  Membership Invoice History (Stripe)
                </h4>
                
                {!editingTutor.stripeCustomerId ? (
                  <p className="text-[11px] text-muted-foreground italic">No Stripe Customer ID associated with this account. (Free/Comped Tier)</p>
                ) : isLoadingPayments ? (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground py-2">
                    <Loader2 className="size-3.5 animate-spin" />
                    Fetching payment invoices from Stripe...
                  </div>
                ) : paymentsError ? (
                  <p className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">{paymentsError}</p>
                ) : stripePayments.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">No successful payments found in Stripe invoice history.</p>
                ) : (
                  <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden text-xs max-h-48 overflow-y-auto">
                    <table className="min-w-full divide-y divide-border/60">
                      <thead className="bg-muted/40 text-[9px] font-bold uppercase text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Invoice No.</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2 text-center">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-[11px] text-foreground font-medium">
                        {stripePayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-muted/30">
                            <td className="px-3 py-1.5 text-muted-foreground">
                              {formatDate(payment.date)}
                            </td>
                            <td className="px-3 py-1.5 font-mono text-[10px]">
                              {payment.number || payment.id.slice(0, 10) + "..."}
                            </td>
                            <td className="px-3 py-1.5 text-right font-semibold">
                              {formatMoney(payment.amountCents, payment.currency)}
                            </td>
                            <td className="px-3 py-1.5 text-center">
                              {payment.hostedInvoiceUrl ? (
                                <a 
                                  href={payment.hostedInvoiceUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline font-bold"
                                >
                                  View
                                </a>
                              ) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTutor(null)}
                  disabled={isSavingDetails}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingDetails}
                  className="gap-1.5 font-semibold text-white bg-primary hover:bg-primary/90"
                >
                  {isSavingDetails ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {messagingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
              <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                <Mail className="size-5 text-primary" />
                Message User: {messagingUser.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMessagingUser(null);
                  setMessageText("");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recipient Email</p>
                <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-xl border border-border/60 mt-1 select-all font-mono">
                  {messagingUser.email}
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="admin-message-content" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Message Content (Will be emailed directly)
                </label>
                <textarea
                  id="admin-message-content"
                  rows={6}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write your email message to this user here... It will come from Yazzow Support."
                  className="flex w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/15"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMessagingUser(null);
                    setMessageText("");
                  }}
                  className="h-10 px-4 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSendingMessage || !messageText.trim()}
                  onClick={async () => {
                    setIsSendingMessage(true);
                    try {
                      const res = await sendAdminDirectMessageAction({
                        recipientEmail: messagingUser.email,
                        recipientName: messagingUser.name,
                        tutorId: messagingUser.tutorId,
                        message: messageText,
                      });
                      if (res.ok) {
                        alert("Message sent successfully!");
                        setMessagingUser(null);
                        setMessageText("");
                        router.refresh();
                      } else {
                        alert(`Failed to send message: ${res.error}`);
                      }
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Error sending message");
                    } finally {
                      setIsSendingMessage(false);
                    }
                  }}
                  className="h-10 px-5 font-semibold text-xs rounded-xl text-white bg-primary hover:bg-primary/95"
                >
                  {isSendingMessage ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      Send Email Message
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Tabs>
  );
}
