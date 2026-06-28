import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { BRAND_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/50 bg-card/50">
      <div className="yazz-container grid gap-10 py-12 sm:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <Logo size="header" />
          <p className="mt-4 max-w-xs text-sm yazz-muted">
            The business home for independent tutors. Your link, your brand, no public
            directory.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/tutor/demo" className="transition hover:text-primary">
                Sample portal
              </Link>
            </li>
            <li>
              <Link href="/auth/signup" className="transition hover:text-primary">
                Get started
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="transition hover:text-primary">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Help</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/support" className="transition hover:text-primary">
                Support tickets
              </Link>
            </li>
            <li>
              <Link href="/auth/login" className="transition hover:text-primary">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/terms-and-conditions" className="transition hover:text-primary">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="transition hover:text-primary">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="transition hover:text-primary">
                Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/security" className="transition hover:text-primary">
                Security
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/50 py-5">
        <div className="yazz-container flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
          <p>No public directory · Phonetic links · Paid upfront bookings</p>
        </div>
      </div>
    </footer>
  );
}
