import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { InstallAppButton } from "@/components/pwa/install-app-button";

export async function SiteHeader() {
  let user: { id: string } | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background">
      <div className="yazz-container flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-8">
          <Logo size="header" />
          <nav className="hidden min-w-0 items-center gap-1 lg:flex">
            <Link
              href="/#features"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Pricing
            </Link>
            <Link
              href="/#slot-alerts"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Slot alerts
            </Link>
            <Link
              href="/tutor/demo"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Sample portal
            </Link>
            <Link
              href="/support"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Support
            </Link>
          </nav>
        </div>
        <nav className="flex shrink-0 items-center gap-2">
          <InstallAppButton size="sm" variant="outline" className="hidden sm:inline-flex" />
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Dashboard
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
