import { MarketingShell } from "@/components/layout/marketing-shell";
import { BRAND_NAME } from "@/lib/constants";
import Link from "next/link";

export const metadata = {
  title: `Refund Policy · ${BRAND_NAME}`,
  description: `Read the Refund Policy for platform subscriptions, digital worksheets, and lesson bookings on ${BRAND_NAME}.`,
  robots: {
    index: false,
    follow: false,
  },
};


export default function RefundPolicyPage() {
  return (
    <MarketingShell>
      <div className="bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="yazz-container max-w-3xl py-16 sm:py-20 space-y-8">
          {/* Page Header */}
          <div className="space-y-3 border-b border-border/60 pb-8">
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">Billing Compliance</p>
            <h1 className="font-heading text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Refund Policy
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Policy Content */}
          <div className="space-y-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground">
              Thank you for using {BRAND_NAME}. This Refund Policy describes the refund terms for monthly tutor subscription plans, digital storefront worksheets, and parent lesson bookings made through the Platform.
            </p>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">1.</span> Tutor Subscription Fees
              </h2>
              <p>
                Tutors pay a monthly subscription fee to use the Platform&apos;s CRM, scheduling, and billing tools.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Tutor subscriptions can be cancelled at any time from your Dashboard Settings Billing Portal.</li>
                <li>Upon cancellation, your tutor portal remains active until the end of your current paid billing cycle.</li>
                <li>Monthly subscription payments are generally non-refundable. If you experience technical platform issues that prevent you from using the service, please open a support ticket to request a discretionary partial refund.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">2.</span> Storefront Digital Resources (Worksheets)
              </h2>
              <p>
                Worksheets, study guides, and digital books sold through tutor storefronts are **digital products** that are delivered immediately via email download links upon checkout.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Because digital files are instantly downloadable and cannot be returned, all digital storefront sales are **non-refundable**.</li>
                <li>If you receive a corrupted download link, purchase the wrong file format by mistake, or experience download issues, please contact our support team at <a href="mailto:support@yazzow.com" className="text-primary hover:underline font-bold">support@yazzow.com</a>. We will verify your order and replace the link or process a refund where appropriate.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">3.</span> Lesson Bookings &amp; Packages
              </h2>
              <p>
                Payments for lesson bookings and package checkouts are held by the payment processor and disbursed to tutors. Individual tutors establish their own booking cancellation and refund rules:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Tutor-Led Cancellations:</strong> If your tutor cancels a scheduled lesson slot, the booking status changes to cancelled, and your prepaid lesson credit is immediately returned to your parent ledger.</li>
                <li><strong>No-Shows &amp; Late Cancellations:</strong> If you cancel a lesson without the notice required by your tutor, the tutor reserves the right to withhold the credit.</li>
                <li><strong>Disputes:</strong> If you seek a monetary refund for prepaid packages, please coordinate with your tutor. Tutors can issue booking refunds directly from their dashboard. If you cannot reach your tutor, you may open a support ticket with the details.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">4.</span> Stripe Transactions &amp; Refunds
              </h2>
              <p>
                For payments processed through Stripe, refunds are issued back to the original payment method. If a refund is approved by our support team or by a tutor, Stripe will process the refund. Processing times typically vary between 5 to 10 business days for funds to appear back on your card or bank statement.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">5.</span> How to Request a Refund
              </h2>
              <p>
                To submit a refund request, please open a support request at <Link href="/support" className="text-primary hover:underline font-bold font-heading">yazzow.com/support</Link> or email us at <a href="mailto:support@yazzow.com" className="text-primary hover:underline font-bold">support@yazzow.com</a>. Please include your order ID, checkout email, and the reason for your request.
              </p>
            </section>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
