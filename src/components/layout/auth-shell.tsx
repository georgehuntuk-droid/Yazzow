import { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { BRAND_NAME } from "@/lib/constants";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary/20 via-[oklch(0.52_0.17_286/0.12)] to-background px-10 py-12 lg:flex lg:w-[44%] lg:flex-col lg:justify-between">
        <div aria-hidden className="yazz-grid-bg absolute inset-0 opacity-20" />
        <Logo size="lg" />
        <div className="relative">
          <p className="yazz-eyebrow mb-5">{BRAND_NAME}</p>
          <h1 className="text-4xl font-bold leading-tight">{title}</h1>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
        <p className="relative text-xs text-muted-foreground">
          No public directory · Your phonetic link · Paid upfront bookings
        </p>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-primary/20 blur-[80px]"
        />
      </section>
      <section className="flex flex-1 flex-col bg-background">
        <header className="border-b border-border/60 px-4 py-4 lg:hidden sm:px-6">
          <Logo size="header" />
        </header>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </section>
    </div>
  );
}
