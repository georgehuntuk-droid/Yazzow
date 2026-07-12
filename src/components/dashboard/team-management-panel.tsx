"use client";

import { useState } from "react";
import { 
  UserPlus, 
  Trash2, 
  Clock, 
  Check, 
  X, 
  Mail, 
  Loader2, 
  UserCheck, 
  ExternalLink,
  Shield,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  inviteTeamMember, 
  removeTeamMember, 
  cancelInvitation, 
  type TeamMember, 
  type PendingInvitation 
} from "@/lib/dashboard/team-actions";

type TeamManagementPanelProps = {
  initialActiveMembers: TeamMember[];
  initialPendingInvites: PendingInvitation[];
};

export function TeamManagementPanel({ 
  initialActiveMembers, 
  initialPendingInvites 
}: TeamManagementPanelProps) {
  const [activeMembers, setActiveMembers] = useState<TeamMember[]>(initialActiveMembers);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>(initialPendingInvites);
  
  // Modals & Action States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({});

  const handleOpenInvite = () => {
    setInviteEmail("");
    setInviteError(null);
    setInviteSuccess(false);
    setIsInviteModalOpen(true);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmittingInvite(true);
    setInviteError(null);

    const res = await inviteTeamMember(inviteEmail);
    setIsSubmittingInvite(false);

    if (res.ok) {
      setInviteSuccess(true);
      // Optimistically add to pending list (we don't have the new ID immediately, but we can refetch or wait for reload)
      // For simplicity, let's create a temporary object
      const tempInvite: PendingInvitation = {
        id: Math.random().toString(),
        email: inviteEmail.trim().toLowerCase(),
        createdAt: new Date().toISOString()
      };
      setPendingInvites(prev => [tempInvite, ...prev]);
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteSuccess(false);
      }, 1500);
    } else {
      setInviteError(res.error || "Failed to send invitation.");
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to withdraw this invitation?")) return;

    setLoadingActions(prev => ({ ...prev, [inviteId]: true }));
    const res = await cancelInvitation(inviteId);
    setLoadingActions(prev => ({ ...prev, [inviteId]: false }));

    if (res.ok) {
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
    } else {
      alert(res.error || "Failed to cancel invitation.");
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your Academy? They will lose access to the Academy portal but retain their standalone tutor account.`)) return;

    setLoadingActions(prev => ({ ...prev, [memberId]: true }));
    const res = await removeTeamMember(memberId);
    setLoadingActions(prev => ({ ...prev, [memberId]: false }));

    if (res.ok) {
      setActiveMembers(prev => prev.filter(m => m.id !== memberId));
    } else {
      alert(res.error || "Failed to remove team member.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="yazz-panel p-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Staff</span>
            <UserCheck className="size-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{activeMembers.length}</span>
            <span className="text-xs text-muted-foreground">Tutors</span>
          </div>
        </div>

        <div className="yazz-panel p-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Invites</span>
            <Clock className="size-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{pendingInvites.length}</span>
            <span className="text-xs text-muted-foreground">Awaiting registration</span>
          </div>
        </div>

        <div className="yazz-panel p-6 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Expand Your Team</h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Register new professional tutors to coordinate schedules and scale lesson volumes.
            </p>
          </div>
          <Button onClick={handleOpenInvite} className="w-full flex items-center justify-center gap-2">
            <UserPlus className="size-4" />
            Invite Staff Tutor
          </Button>
        </div>
      </div>

      {/* Directory Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Briefcase className="size-5 text-primary" />
          Staff Directory
        </h2>
        
        {activeMembers.length === 0 ? (
          <div className="yazz-surface p-8 text-center space-y-4">
            <UsersPlaceholder />
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-foreground">No staff tutors yet</h3>
              <p className="text-xs text-muted-foreground leading-normal">
                Invite tutors by their email address. Once they complete onboarding, they will appear in your directory automatically.
              </p>
            </div>
            <Button onClick={handleOpenInvite} variant="outline" size="sm" className="gap-2">
              <UserPlus className="size-4" />
              Send First Invite
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeMembers.map((member) => (
              <div 
                key={member.id} 
                className="yazz-surface p-5 flex flex-col sm:flex-row items-start gap-4 transition duration-300 hover:-translate-y-0.5"
              >
                {/* Avatar */}
                <div className="size-12 rounded-xl overflow-hidden bg-primary/5 flex-shrink-0 border border-border/80 flex items-center justify-center">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.displayName} className="size-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-primary uppercase">
                      {member.displayName.slice(0, 2)}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-foreground truncate">{member.displayName}</h3>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary border border-primary/20">
                      <Shield className="size-2" />
                      Staff
                    </span>
                  </div>
                  {member.headline && (
                    <p className="text-xs text-muted-foreground font-medium truncate">{member.headline}</p>
                  )}
                  
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Lesson Rate: <strong className="text-foreground">£{(member.lessonPriceCents / 100).toFixed(2)}</strong>
                    </span>
                    <span className="text-muted-foreground text-[10px]">·</span>
                    <a 
                      href={`/tutor/${member.username}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
                    >
                      View Booking Page
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>

                {/* Action */}
                <Button 
                  onClick={() => handleRemoveMember(member.id, member.displayName)}
                  variant="outline" 
                  size="sm"
                  className="self-end sm:self-start border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1 px-2.5 py-1 h-8 rounded-lg"
                  disabled={loadingActions[member.id]}
                >
                  {loadingActions[member.id] ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="size-5 text-amber-500" />
            Pending Invitations
          </h2>

          <div className="yazz-surface p-4 divide-y divide-border/60">
            {pendingInvites.map((invite) => (
              <div 
                key={invite.id} 
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="size-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">{invite.email}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Pending Join
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Invited on {new Date(invite.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    onClick={() => handleCancelInvite(invite.id)}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[11px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive px-2.5 rounded-lg"
                    disabled={loadingActions[invite.id]}
                  >
                    {loadingActions[invite.id] ? (
                      <Loader2 className="size-3.5 animate-spin mr-1" />
                    ) : null}
                    Cancel Invite
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invitation Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-border/80 bg-card shadow-2xl space-y-6">
            <button 
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition"
            >
              <X className="size-4" />
            </button>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-foreground">Invite Staff Tutor</h3>
              <p className="text-xs text-muted-foreground leading-normal">
                Enter the email address of the tutor you want to invite. They will receive an invitation to register and link their calendar to your Academy.
              </p>
            </div>

            {inviteSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center space-y-2 py-6">
                <div className="p-2 w-fit rounded-full bg-emerald-500/10 text-emerald-500 animate-bounce">
                  <Check className="size-6" />
                </div>
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Invitation Sent!</h4>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">The tutor invitation has been queued successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tutor's Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      placeholder="tutor@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-10"
                      disabled={isSubmittingInvite}
                    />
                  </div>
                </div>

                {inviteError && (
                  <p className="text-xs font-semibold text-destructive">{inviteError}</p>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsInviteModalOpen(false)}
                    disabled={isSubmittingInvite}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingInvite} className="gap-2">
                    {isSubmittingInvite ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserPlus className="size-4" />
                    )}
                    Send Invitation
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple illustrative placeholder icon for empty team view
function UsersPlaceholder() {
  return (
    <div className="relative size-16 mx-auto flex items-center justify-center">
      <div className="absolute inset-0 bg-primary/5 rounded-2xl animate-pulse" />
      <UserPlus className="size-8 text-primary/60" />
    </div>
  );
}
