"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Globe,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
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

type AdminConsoleClientProps = {
  tutors: AdminTutorData[];
  platformStats?: unknown;
  isServiceRoleConfigured?: boolean;
  supportTickets: SupportTicket[];
  notices: AdminNotice[];
};

export function AdminConsoleClient({ tutors, isServiceRoleConfigured = true, supportTickets = [], notices = [] }: AdminConsoleClientProps) {
  const [search, setSearch] = useState("");
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

  // Edit Tutor-specific states
  const [editingTutor, setEditingTutor] = useState<AdminTutorData | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPaymentInstructions, setEditPaymentInstructions] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const handleOpenEditModal = (tutor: AdminTutorData) => {
    setEditingTutor(tutor);
    setEditDisplayName(tutor.displayName);
    setEditUsername(tutor.username);
    setEditCurrency(tutor.currency);
    setEditPrice((tutor.lessonPriceCents / 100).toFixed(2));
    setEditPaymentInstructions(tutor.paymentInstructions ?? "");
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
      });

      if (res.ok) {
        setEditingTutor(null);
      } else {
        alert(`Failed to update tutor details: ${res.error}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving tutor details");
    } finally {
      setIsSavingDetails(false);
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

  const renderTicketCard = (ticket: SupportTicket) => {
    const isLoading = actionLoadingId === ticket.id && isPending;
    const draftNotes = editingNotesText[ticket.id] ?? ticket.admin_notes ?? "";
    const isNotesSaving = savingNotesId === ticket.id;
    const matchedTutor = tutors.find(
      (t) => t.email.toLowerCase() === ticket.email.toLowerCase()
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

                // Previous resolved tickets for this tutor/user
                const resolvedTutorTickets = supportTickets.filter(
                  (ticket) =>
                    (ticket.tutor_id === tutor.id || ticket.email.toLowerCase() === tutor.email.toLowerCase()) &&
                    (ticket.status === "resolved" || ticket.status === "closed")
                );

                return (
                  <Card
                    key={tutor.id}
                    className={`yazz-surface transition-all ${
                      hasActiveSub ? "border-emerald-100 dark:border-emerald-950/40" : "border-border/60"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        {/* Tutor info */}
                        <div className="flex items-start gap-4">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                            {tutor.displayName.charAt(0).toUpperCase()}
                          </div>
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

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 border-y border-border/40 py-4 lg:grid-cols-3 lg:border-y-0 lg:py-0">
                          <div>
                            <p className="text-xs text-muted-foreground">Lesson Vol (30d)</p>
                            <p className="text-sm font-semibold">{formatMoney(tutor.lessonVolumeCents, tutor.currency)}</p>
                            <p className="text-xs text-muted-foreground">{tutor.lessonCount} booking{tutor.lessonCount === 1 ? "" : "s"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Learning Pack Vol</p>
                            <p className="text-sm font-semibold">{formatMoney(tutor.resourceVolumeCents, tutor.currency)}</p>
                            <p className="text-xs text-muted-foreground">{tutor.resourceCount} download{tutor.resourceCount === 1 ? "" : "s"}</p>
                          </div>
                          <div className="col-span-2 lg:col-span-1">
                            <p className="text-xs text-muted-foreground">Pricing</p>
                            <p className="text-sm font-medium">
                              {formatMoney(tutor.lessonPriceCents, tutor.currency)}/hr
                            </p>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-wrap items-center gap-3 self-end lg:self-start">
                          {/* Stripe Connect Badge */}
                          {tutor.stripeAccountId ? (
                            <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400">
                              <CheckCircle className="size-3.5" />
                              Stripe Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50/50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/10 dark:text-amber-400">
                              <AlertTriangle className="size-3.5" />
                              Stripe Missing
                            </Badge>
                          )}

                          {/* Subscription Badge */}
                          {hasActiveSub ? (
                            <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                              <ShieldCheck className="size-3.5" />
                              Subscribed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <XCircle className="size-3.5" />
                              No Subscription
                            </Badge>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
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

            <form onSubmit={handleSaveTutorDetails} className="space-y-4">
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
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Platform & Billing Audit
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
    </Tabs>
  );
}
