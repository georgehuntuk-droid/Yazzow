"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarRange,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Palette,
  ShieldCheck,
  Users,
  AppWindow,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard#schedule", label: "Schedule", icon: CalendarRange },
  { href: "/dashboard#ledger", label: "My Students", icon: Users },
  { href: "/dashboard#storefront", label: "Shop Manager", icon: BookOpen },
  { href: "/dashboard/payments", label: "Earnings", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Palette },
] as const;

type DashboardNavProps = {
  isAdmin?: boolean;
};

export function DashboardNav({ isAdmin = false }: DashboardNavProps) {
  const pathname = usePathname();
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const win = window as any;
    if (win.deferredPrompt) {
      setCanInstall(true);
    }
    const handleCanInstall = () => setCanInstall(true);
    const handleInstalled = () => setCanInstall(false);

    window.addEventListener("pwa-can-install", handleCanInstall);
    window.addEventListener("pwa-installed", handleInstalled);
    return () => {
      window.removeEventListener("pwa-can-install", handleCanInstall);
      window.removeEventListener("pwa-installed", handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const win = window as any;
    const promptEvent = win.deferredPrompt;
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch (err) {
      console.error("Install prompt failed:", err);
    } finally {
      win.deferredPrompt = null;
      setCanInstall(false);
    }
  };

  return (
    <aside className="flex w-full flex-col border-b border-sidebar-border bg-sidebar/50 lg:min-h-full lg:w-64 lg:border-b-0 lg:border-r">
      <div className="px-6 py-6">
        <Logo href="/" size="header" />
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary/80">Tutor Workspace</p>
      </div>
      <Separator className="bg-sidebar-border" />
      <nav className="flex flex-1 flex-row gap-1.5 overflow-x-auto p-4 lg:flex-col lg:overflow-visible">
        {navItems.map((item) => {
          const active =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_4px_16px_oklch(0.55_0.18_250/0.25)] ring-1 ring-primary/10"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <Separator className="my-2 hidden bg-sidebar-border lg:block" />
            <Link
              href="/admin"
              className={cn(
                "inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200",
                pathname.startsWith("/admin")
                  ? "bg-amber-500 text-white shadow-sm ring-1 ring-amber-500/15"
                  : "text-muted-foreground hover:bg-amber-500/5 hover:text-amber-600",
              )}
            >
              <ShieldCheck className="size-4.5 shrink-0" />
              Admin Console
            </Link>
          </>
        )}
      </nav>
      <div className="flex flex-col gap-2.5 border-t border-sidebar-border p-4">
        {canInstall && (
          <Button 
            type="button"
            variant="outline" 
            className="w-full justify-start rounded-xl font-semibold border-primary/30 bg-primary/8 text-primary hover:bg-primary/15"
            onClick={handleInstallClick}
          >
            <AppWindow className="size-4" data-icon="inline-start" />
            Download App
          </Button>
        )}
        <Button variant="outline" className="w-full justify-start rounded-xl font-semibold border-border/80" render={<Link href="/support" />}>
          <HelpCircle className="size-4 text-primary" data-icon="inline-start" />
          Support Ticket
        </Button>
        <form action="/auth/signout" method="post" className="w-full">
          <Button type="submit" variant="ghost" className="w-full justify-start rounded-xl font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5">
            <LogOut className="size-4" data-icon="inline-start" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  );
}
