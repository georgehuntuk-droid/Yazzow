import { MarketingShell } from "@/components/layout/marketing-shell";
import { BRAND_NAME } from "@/lib/constants";
import Link from "next/link";

export const metadata = {
  title: `Terms & Conditions · ${BRAND_NAME}`,
  description: `Read the Terms of Service and user agreement for the ${BRAND_NAME} platform.`,
};

export default function TermsPage() {
  return (
    <MarketingShell>
      <div className="bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="yazz-container max-w-3xl py-16 sm:py-20 space-y-8">
          {/* Page Header */}
          <div className="space-y-3 border-b border-border/60 pb-8">
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">Legal Agreement</p>
            <h1 className="font-heading text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Terms &amp; Conditions
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Policy Content */}
          <div className="space-y-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground">
              Welcome to {BRAND_NAME}. Please read these Terms and Conditions (&ldquo;Terms&rdquo;) carefully before using the website located at <Link href="/" className="text-primary hover:underline font-bold">yazzow.com</Link> and all associated subdomains, portals, and services (collectively, the &ldquo;Platform&rdquo;) operated by {BRAND_NAME} (&ldquo;us&rdquo;, &ldquo;we&rdquo;, or &ldquo;our&rdquo;).
            </p>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">1.</span> Acceptance of Terms
              </h2>
              <p>
                By accessing, browsing, or using the Platform, or by creating a tutor or student account, you agree to be bound by these Terms, our Privacy Policy, and our Refund Policy. If you do not agree to all of these Terms, you must immediately cease all access and use of the Platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">2.</span> Description of Service
              </h2>
              <p>
                {BRAND_NAME} provides a white-label scheduling platform, digital worksheet storefront, parent messaging portal, and student CRM system for independent educators and tutors. The Platform allows tutors to list availability slots, sell educational resources, manage credits, and assign tasks. We do not operate a public tutor marketplace; we provide software solutions to host your private teaching brand.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">3.</span> Payment Processing
              </h2>
              <p>
                To handle Platform subscription fees, lesson bookings, package checkouts, and worksheet purchases, we integrate with secure third-party payment processors, primarily **Stripe**.
              </p>
              <p>
                All transactions are processed securely via Stripe. By purchasing services, packages, or digital products through the Platform, you agree to Stripe&apos;s checkout terms and conditions. Tutors connect their own bank or card accounts via Stripe Connect to receive payouts. The Platform facilitates these payouts but does not store credit card credentials on our servers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">4.</span> Tutor Accounts &amp; Subscriptions
              </h2>
              <p>
                Tutors must register for an account to list scheduling slots and worksheets. Tutors are billed a monthly subscription fee as specified in our pricing details. 
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>Subscriptions automatically renew every month unless cancelled via your Billing Portal.</li>
                <li>Tutors are solely responsible for coordinating with students, delivering lessons, and honoring prepaid credits.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">5.</span> Student/Parent Portals &amp; Bookings
              </h2>
              <p>
                Parents and students accessing tutor-specific workspaces must provide accurate details. Lesson bookings are subject to the specific tutor&apos;s availability calendar. Pre-paid lesson credits are stored in the student ledger.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">6.</span> Intellectual Property &amp; Worksheet Sales
              </h2>
              <p>
                Tutors retain ownership of all worksheet files, curriculum plans, and materials they upload to the Platform storefront. By purchasing digital resources, parents are granted a non-exclusive, non-transferable, single-family personal license to download and print the worksheet. Redistribution or resale of storefront resources is strictly prohibited.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">7.</span> Limitation of Liability
              </h2>
              <p>
                In no event shall {BRAND_NAME}, its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the Platform, lesson cancellations, payout disputes, or database maintenance outages.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">8.</span> Governing Law &amp; Changes to Terms
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions. We reserve the right to modify these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">9.</span> Contact Us
              </h2>
              <p>
                If you have any questions about these Terms, please contact our support team at{" "}
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
