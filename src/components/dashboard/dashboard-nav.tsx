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
  MessageSquare,
  Calculator,
  FileSpreadsheet,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { PushSubscriptionToggle } from "@/components/pwa/push-subscription-toggle";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarRange },
  { href: "/dashboard/students", label: "My Students", icon: Users },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/storefront", label: "Shop Manager", icon: BookOpen },
  { href: "/dashboard/payments", label: "Earnings", icon: CreditCard },
  { href: "/dashboard/tools/invoice-generator", label: "Invoice Maker", icon: FileSpreadsheet },
  { href: "/dashboard/tools/rate-calculator", label: "Rate Calculator", icon: Calculator },
  { href: "/dashboard/settings", label: "Settings", icon: Palette },
  { href: "/dashboard/demo-guide", label: "Tutor Guide", icon: HelpCircle },
] as const;

type DashboardNavProps = {
  isAdmin?: boolean;
};

export function DashboardNav({ isAdmin = false }: DashboardNavProps) {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    async function checkUnread() {
      try {
        const res = await fetch("/api/messages");
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && Array.isArray(data.threads)) {
          const count = data.threads.reduce((sum: number, t: any) => sum + (t.unreadCount || 0), 0);
          setUnreadMessages(count);
        }
      } catch (err) {
        console.error("Failed to fetch unread messages count:", err);
      }
    }

    void checkUnread();
    const interval = setInterval(checkUnread, 10000); // poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="flex w-full flex-col border-b border-sidebar-border bg-sidebar/50 lg:min-h-full lg:w-64 lg:border-b-0 lg:border-r">
      <div className="px-6 py-6">
        <Logo href="/" size="header" />
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary/80">Tutor Workspace</p>
      </div>
      <Separator className="bg-sidebar-border" />
      <nav className="flex flex-1 flex-row gap-1.5 overflow-x-auto px-4 pt-4 pb-2.5 scrollbar-thin-primary lg:flex-col lg:overflow-visible lg:p-4">
        {navItems.map((item) => {
          const active =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              {...("external" in item && item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cn(
                "inline-flex items-center justify-between gap-3 w-auto lg:w-full rounded-xl px-4 py-3 text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_4px_16px_oklch(0.55_0.18_250/0.25)] ring-1 ring-primary/10"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="size-4.5 shrink-0" />
                {item.label}
              </div>
              {item.label === "Messages" && unreadMessages > 0 && (
                <span className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black shrink-0",
                  active 
                    ? "bg-background text-primary" 
                    : "bg-primary text-primary-foreground"
                )}>
                  {unreadMessages}
                </span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <Separator className="my-2 hidden bg-sidebar-border lg:block" />
            <Link
              href="/admin"
              className={cn(
                "inline-flex items-center gap-3 w-auto lg:w-full rounded-xl px-4 py-3 text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200",
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
        <PushSubscriptionToggle className="w-full justify-start border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 text-xs" />
        <InstallAppButton
          variant="outline"
          className="w-full justify-start border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 text-xs"
        />
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
