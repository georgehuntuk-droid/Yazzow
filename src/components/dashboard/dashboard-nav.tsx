"use client";

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
  Users,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/settings", label: "Portal", icon: Palette },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard#schedule", label: "Schedule", icon: CalendarRange },
  { href: "/dashboard#storefront", label: "Learning packs", icon: BookOpen },
  { href: "/dashboard#ledger", label: "Students", icon: Users },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-sidebar-border bg-sidebar lg:min-h-full lg:w-64 lg:border-b-0 lg:border-r">
      <div className="px-5 py-5">
        <Logo href="/dashboard" size="header" />
        <p className="mt-2 text-xs text-muted-foreground">Private tutor workspace</p>
      </div>
      <Separator className="bg-sidebar-border" />
      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
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
                "inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-2 border-t border-sidebar-border p-4">
        <Button variant="outline" className="w-full justify-start" render={<Link href="/support" />}>
          <HelpCircle className="size-4" data-icon="inline-start" />
          Support ticket
        </Button>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="ghost" className="w-full justify-start">
            <LogOut className="size-4" data-icon="inline-start" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
