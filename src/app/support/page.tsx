import { MarketingShell } from "@/components/layout/marketing-shell";
import { SupportTicketForm } from "@/components/support/ticket-form";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Support · ${BRAND_NAME}`,
  description: `Get in touch with the ${BRAND_NAME} support team. Submit a support ticket for billing, account setup, or general assistance.`,
};

export default function SupportPage() {
  return (
    <MarketingShell>
      <div className="yazz-container flex-1 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
          <div>
            <p className="text-sm font-medium text-primary">Help centre</p>
            <h1 className="mt-2 font-heading text-4xl font-semibold">Support</h1>
            <p className="mt-4 max-w-xl yazz-muted">
              Something not working? Billing question? Send a message using the contact form, and our team will review and address it directly.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">1.</span>
                Use the form — it goes straight to our in-house support dashboard.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">2.</span>
                For payout issues, include your tutor username and approximate payment date.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">3.</span>
                Tutors can also reach us directly from the dashboard sidebar.
              </li>
            </ul>
            <p className="mt-8 text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/dashboard" className="font-medium text-primary hover:underline">
                Go to dashboard
              </a>
            </p>
          </div>
          <SupportTicketForm />
        </div>
      </div>
    </MarketingShell>
  );
}
