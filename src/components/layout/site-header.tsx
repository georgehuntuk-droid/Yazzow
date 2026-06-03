import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

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
      <div className="yazz-container flex h-16 items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-8">
          <Logo size="header" />
          <nav className="hidden items-center gap-1 lg:flex">
            <Button variant="ghost" size="sm" render={<Link href="/#features" />}>
              Features
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/#pricing" />}>
              Pricing
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/tutor/demo" />}>
              Sample portal
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/support" />}>
              Support
            </Button>
          </nav>
        </div>
        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
                Dashboard
              </Button>
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/auth/login" />}>
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/auth/signup" />}>
                Get started
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
