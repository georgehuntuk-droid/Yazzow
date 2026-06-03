import Link from "next/link";

import { isSlackConfigured } from "@/lib/slack/webhook";
import { SupportTicketForm } from "@/components/support/ticket-form";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Support · ${BRAND_NAME}`,
};

export default function SupportPage() {
  const configured = isSlackConfigured();

  return (
    <MarketingShell>
      <div className="yazz-container flex-1 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
          <div>
            <p className="text-sm font-medium text-primary">Help centre</p>
            <h1 className="mt-2 font-heading text-4xl font-semibold">Support tickets</h1>
            <p className="mt-4 max-w-xl yazz-muted">
              Something not working? Billing question? Send a ticket — it posts straight to our
              Slack channel using a free Incoming Webhook. No paid Slack app required.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">1.</span>
                Fill in the form — we typically reply by email within one business day.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">2.</span>
                For payout issues, include your tutor username and approximate payment date.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">3.</span>
                Tutors can also open tickets from the dashboard sidebar.
              </li>
            </ul>
            <p className="mt-8 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/dashboard" className="font-medium text-primary hover:underline">
                Go to dashboard
              </Link>
            </p>
          </div>
          <SupportTicketForm configured={configured} />
        </div>
      </div>
    </MarketingShell>
  );
}
