import { AuthShell } from "@/components/layout/auth-shell";
import { LogOut, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function BannedPage() {
  return (
    <AuthShell
      title="Account Suspended"
      subtitle="Access to this tutor portal has been disabled by the system administrator."
    >
      <div className="space-y-6">
        <Card className="yazz-surface border-destructive/20 shadow-[0_8px_32px_oklch(0.55_0.2_25/0.1)]">
          <CardContent className="pt-6 space-y-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
              <ShieldAlert className="size-6 animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-heading text-lg font-bold text-foreground">
                Administrative Hold
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This account is currently banned or suspended from Yazzow. All booking portals, availability slots, and workspaces associated with this account are offline.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                If you believe this is a mistake or would like to request an appeal, please contact support at <a href="mailto:support@yazzow.com" className="text-primary underline">support@yazzow.com</a>.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2.5 pt-2">
          <form action="/auth/signout" method="post" className="w-full">
            <button
              type="submit"
              className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
            >
              <LogOut className="size-3.5" />
              Sign out of this account
            </button>
          </form>
        </div>
      </div>
    </AuthShell>
  );
}
