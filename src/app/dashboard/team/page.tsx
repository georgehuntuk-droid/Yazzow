import type { Metadata } from "next";
import Link from "next/link";
import { Users, ShieldAlert, Sparkles, UserPlus } from "lucide-react";
import { requireTutorProfile } from "@/lib/auth/session";
import { getTutorSubscriptionState } from "@/lib/stripe/subscription";
import { getTeamMembers, getPendingInvitations } from "@/lib/dashboard/team-actions";
import { TeamManagementPanel } from "@/components/dashboard/team-management-panel";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My Team · Dashboard",
  description: "Manage your Academy team and staff tutors.",
};

export default async function TeamDashboardPage() {
  const { profile } = await requireTutorProfile();
  const subState = await getTutorSubscriptionState(profile.id);
  const tier = subState.subscriptionTier;
  const isAcademy = tier === "academy" || tier === "agency";

  if (!isAcademy) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 rounded-3xl border border-primary/10 bg-gradient-to-b from-card to-secondary/30 shadow-xl space-y-8 relative overflow-hidden backdrop-blur-md">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 size-48 rounded-full bg-primary/8 blur-[80px]" />
          <div className="absolute -bottom-24 -right-24 size-48 rounded-full bg-primary/8 blur-[80px]" />

          {/* Premium Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary animate-pulse">
            <Sparkles className="size-3" />
            Academy Premium Feature
          </div>

          <div className="space-y-4 max-w-lg">
            <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tight text-foreground">
              Multi-Tutor Management
            </h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Scale your tuition business by adding employee and staff tutors under your academy banner. Share your custom branding, manage team schedules, and centralise your student bookings.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl text-left">
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
              <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-500">
                <UserPlus className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Sub-Accounts</h3>
              <p className="text-xs text-muted-foreground">Invite staff tutors with their own private logins & calendars.</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
              <div className="p-2 w-fit rounded-lg bg-yellow-500/10 text-yellow-600">
                <Sparkles className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Shared Branding</h3>
              <p className="text-xs text-muted-foreground">Staff profiles automatically inherit your logo, colors, and announcements.</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
              <div className="p-2 w-fit rounded-lg bg-purple-500/10 text-purple-500">
                <Users className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Central Directory</h3>
              <p className="text-xs text-muted-foreground">Parents can view and book any of your tutors from a single portal page.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" render={<Link href="/dashboard/payments#subscription" />}>
              Upgrade to The Academy (£79/mo)
            </Button>
            <Button variant="outline" size="lg" render={<Link href="/dashboard" />}>
              Back to Overview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fetch team details
  const [activeMembers, pendingInvites] = await Promise.all([
    getTeamMembers(),
    getPendingInvitations(),
  ]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-sans text-foreground tracking-tight flex items-center gap-2">
            <Users className="size-6 text-primary" />
            Academy Team Management
          </h1>
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            Manage your employee tutors, review pending invites, and scale your tuition academy.
          </p>
        </div>
      </div>

      {/* Main panel component */}
      <TeamManagementPanel
        initialActiveMembers={activeMembers}
        initialPendingInvites={pendingInvites}
      />
    </div>
  );
}
