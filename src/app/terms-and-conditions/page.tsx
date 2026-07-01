import { MarketingShell } from "@/components/layout/marketing-shell";
import { BRAND_NAME } from "@/lib/constants";
import Link from "next/link";

export const metadata = {
  title: `Terms & Conditions · ${BRAND_NAME}`,
  description: `Read the Terms of Service and user agreement for the ${BRAND_NAME} platform.`,
  robots: {
    index: false,
    follow: false,
  },
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
                <span className="text-primary">2.</span> Description of Service &amp; CRM Status
              </h2>
              <p>
                {BRAND_NAME} provides a tutor-pupil management and scheduling platform, digital worksheet storefront, parent messaging portal, and student CRM (Customer Relationship Management) system for independent educators and tutors. The Platform is strictly a software utility designed to help tutors manage and organize their teaching business. We do not operate a tutor agency, we do not employ tutors, and we are not party to any tutoring agreements.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">3.</span> Payment Processing &amp; Collection Disclaimer
              </h2>
              <p>
                To handle Platform subscription fees, lesson bookings, package checkouts, and worksheet purchases, we integrate with secure third-party payment processors, primarily **Stripe**.
              </p>
              <p>
                Tutors connect their own bank or card accounts via Stripe Connect to receive payouts. Tutors may also choose to allow offline payment methods (such as cash or bank transfers) and configure custom student credit limits (allowing bookings on account/overdraft).
              </p>
              <p className="font-semibold text-foreground bg-primary/5 p-4 rounded-xl border border-primary/10">
                ⚠️ **Strict Payment Terms &amp; Full Immunity:** All financial transactions, credit extensions, offline checkouts, and lesson pricing details are agreements made solely and privately between the tutor and the parent. {BRAND_NAME} is not responsible for, and will not participate in, chasing outstanding payments, collecting student debts, or resolving customer billing disputes. If a parent fails to pay an outstanding balance or cancels a booking, it is strictly a private matter between the tutor and the parent. {BRAND_NAME} holds full legal immunity and is entirely exempt from any liability regarding payment collection, client defaults, or financial losses.
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
                <span className="text-primary">7.</span> Limitation of Liability &amp; Indemnity
              </h2>
              <p>
                In no event shall {BRAND_NAME}, its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the Platform, lesson cancellations, payout disputes, parent non-payment, uncollected invoice amounts, or database maintenance outages. Tutors agree to indemnify and hold harmless {BRAND_NAME} against any claims, losses, or legal disputes arising from client payment disputes, defaults, or tutor-parent classroom issues.
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
