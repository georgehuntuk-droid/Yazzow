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
    <div className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary/20 via-[oklch(0.52_0.17_286/0.12)] to-background px-8 py-10 lg:flex lg:min-h-screen lg:w-[min(44%,32rem)] lg:flex-col lg:justify-between lg:px-10 lg:py-12">
        <div aria-hidden className="yazz-grid-bg absolute inset-0 opacity-20" />
        <Logo size="lg" />
        <div className="relative max-w-md">
          <p className="yazz-eyebrow mb-5">{BRAND_NAME}</p>
          <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
        <p className="relative text-xs text-muted-foreground">
          No public directory · Your phonetic link · Paid upfront bookings
        </p>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-primary/20 blur-[80px]"
        />
      </section>
      <section className="flex min-h-screen flex-1 flex-col bg-background">
        <header className="border-b border-border/60 px-4 py-4 sm:px-6 lg:hidden">
          <Logo size="header" />
        </header>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </section>
    </div>
  );
}
