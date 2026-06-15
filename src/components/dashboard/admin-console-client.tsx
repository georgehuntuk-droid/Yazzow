"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
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
} from "@/lib/dashboard/admin-actions";

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

type AdminConsoleClientProps = {
  tutors: AdminTutorData[];
  platformStats?: unknown;
  isServiceRoleConfigured?: boolean;
  supportTickets: SupportTicket[];
};

export function AdminConsoleClient({ tutors, isServiceRoleConfigured = true, supportTickets = [] }: AdminConsoleClientProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active_sub" | "no_sub" | "stripe_ok" | "stripe_missing">("all");
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Ticket-specific states
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "resolved" | "closed">("open");
  const [editingNotesText, setEditingNotesText] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);

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

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Search and filter logic for support tickets
  const filteredTickets = supportTickets.filter((ticket) => {
    const matchesSearch =
      ticket.name.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.email.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.message.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      (ticket.admin_notes && ticket.admin_notes.toLowerCase().includes(ticketSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (ticketFilter !== "all" && ticket.status !== ticketFilter) return false;
    return true;
  });

  return (
    <Tabs defaultValue="tutors" className="w-full">
      <TabsList className="h-11 w-full justify-start rounded-xl bg-muted/60 p-1 sm:w-auto mb-6">
        <TabsTrigger value="tutors" className="rounded-lg px-4 font-semibold">
          Tutor Directory ({tutors.length})
        </TabsTrigger>
        <TabsTrigger value="tickets" className="rounded-lg px-4 font-semibold">
          Support Tickets ({supportTickets.filter(t => t.status === "open").length} Open)
        </TabsTrigger>
      </TabsList>

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
                placeholder="Search tickets by name, email, message..."
                className="pl-10"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={ticketFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTicketFilter("all")}
              >
                All ({supportTickets.length})
              </Button>
              <Button
                variant={ticketFilter === "open" ? "default" : "outline"}
                size="sm"
                onClick={() => setTicketFilter("open")}
              >
                Open ({supportTickets.filter(t => t.status === "open").length})
              </Button>
              <Button
                variant={ticketFilter === "resolved" ? "default" : "outline"}
                size="sm"
                onClick={() => setTicketFilter("resolved")}
              >
                Resolved ({supportTickets.filter(t => t.status === "resolved").length})
              </Button>
              <Button
                variant={ticketFilter === "closed" ? "default" : "outline"}
                size="sm"
                onClick={() => setTicketFilter("closed")}
              >
                Closed ({supportTickets.filter(t => t.status === "closed").length})
              </Button>
            </div>
          </div>

          {/* Tickets Listing */}
          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <Card className="yazz-surface border-dashed p-10 text-center">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">No support tickets match your search/filters.</p>
                </CardContent>
              </Card>
            ) : (
              filteredTickets.map((ticket) => {
                const isLoading = actionLoadingId === ticket.id && isPending;
                const draftNotes = editingNotesText[ticket.id] ?? ticket.admin_notes ?? "";
                const isNotesSaving = savingNotesId === ticket.id;

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
              })
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
