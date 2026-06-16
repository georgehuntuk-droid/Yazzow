import { MarketingShell } from "@/components/layout/marketing-shell";
import { BRAND_NAME } from "@/lib/constants";
import Link from "next/link";

export const metadata = {
  title: `Privacy Policy · ${BRAND_NAME}`,
  description: `Read the Privacy Policy and find out how we protect your personal data on ${BRAND_NAME}.`,
};

export default function PrivacyPolicyPage() {
  return (
    <MarketingShell>
      <div className="bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="yazz-container max-w-3xl py-16 sm:py-20 space-y-8">
          {/* Page Header */}
          <div className="space-y-3 border-b border-border/60 pb-8">
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">Data Protection</p>
            <h1 className="font-heading text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Policy Content */}
          <div className="space-y-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground">
              At {BRAND_NAME}, we value and respect your privacy. This Privacy Policy explains how we collect, use, store, and share your personal data when you access or use <Link href="/" className="text-primary hover:underline font-bold">yazzow.com</Link> (the &ldquo;Platform&rdquo;) or purchase lessons, packages, and worksheets.
            </p>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">1.</span> Information We Collect
              </h2>
              <p>
                We collect information directly from you when you register an account, fill out forms, connect Stripe/Paddle accounts, or purchase services.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>For Tutors:</strong> Name, display name, email, credentials, billing rates, and Stripe/Paddle account details.</li>
                <li><strong>For Parents/Students:</strong> Parent email address, student names (used strictly for class scheduling and dashboard assignment tracking), homework tasks, and lesson notes.</li>
                <li><strong>Payment Information:</strong> We do not store credit card numbers on our servers. All transaction details are processed securely by our payment partners (Stripe or Paddle).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">2.</span> How We Use Your Information
              </h2>
              <p>
                We process personal information for the following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>To establish and maintain your user account and verify authentication credentials.</li>
                <li>To enable independent lesson scheduling, credit ledger updates, and task assignments.</li>
                <li>To handle secure payment checkouts, calculate taxes, and fulfill worksheet sales.</li>
                <li>To send automated notifications (such as sign-up links, slot alert updates, support tickets, and tutor running late alerts).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">3.</span> Data Sharing &amp; Third-Party Services
              </h2>
              <p>
                We never sell your personal information. We share data only with third-party service providers to help run the Platform, including:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Supabase:</strong> For cloud hosting, PostgreSQL database storage, and user authentication management under strict security policies.</li>
                <li><strong>Paddle:</strong> Acting as the Merchant of Record, Paddle receives checkout transaction data, email addresses, and location data to process payments, manage subscriptions, compute regional taxes, and prevent fraudulent checkouts.</li>
                <li><strong>Stripe:</strong> For connected account payouts and billing services.</li>
                <li><strong>Resend:</strong> Used to dispatch system transaction emails, confirmation links, and user alerts.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">4.</span> Cookies &amp; Tracking
              </h2>
              <p>
                We use strictly necessary cookies to keep you signed in to your dashboard session. We do not use third-party advertiser cookies. Vercel Analytics may collect anonymous usage statistics to help us optimize the performance and loading speeds of the Platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">5.</span> GDPR Data Rights (European Users)
              </h2>
              <p>
                If you reside in the UK or the European Union, you have the following rights under GDPR:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The right to access and receive a copy of your personal data.</li>
                <li>The right to request rectification of inaccurate personal information.</li>
                <li>The right to request erasure (deletion) of your student workspace profile and account details.</li>
                <li>The right to object to or restrict processing of your email.</li>
              </ul>
              <p>
                To exercise any of these rights, please email us at <a href="mailto:support@yazzow.com" className="text-primary hover:underline font-bold">support@yazzow.com</a>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">6.</span> Data Security &amp; Retention
              </h2>
              <p>
                We store data using Supabase cloud infrastructure with Row Level Security (RLS) policies strictly limiting access to your threads, logs, and billing files. We retain your information only as long as necessary to provide service, fulfill accounting requirements, or comply with legal responsibilities.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">7.</span> Privacy Contacts
              </h2>
              <p>
                For questions regarding data security, GDPR compliance, or account deletion requests, please contact our Data Protection Officer at{" "}
                <a href="mailto:support@yazzow.com" className="text-primary hover:underline font-bold">
                  support@yazzow.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
