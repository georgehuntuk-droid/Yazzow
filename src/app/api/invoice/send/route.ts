import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendResendEmail } from "@/lib/notifications/auth-email";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user as tutor
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. You must be logged in to send invoices." }, { status: 401 });
    }

    const payload = await request.json();
    const {
      to,
      subject,
      message,
      invoiceNumber,
      issueDate,
      dueDate,
      currency,
      senderName,
      senderBusiness,
      senderEmail,
      senderPhone,
      senderAddress,
      clientName,
      clientAddress,
      items = [],
      taxPercent = 0,
      paymentDetails,
      notes,
      attachHtml = true
    } = payload;

    if (!to || !invoiceNumber) {
      return NextResponse.json({ error: "Recipient email and invoice number are required." }, { status: 400 });
    }

    // 2. Calculations
    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.hours) || 0) * (Number(item.rate) || 0), 0);
    const taxAmount = (subtotal * (Number(taxPercent) || 0)) / 100;
    const total = subtotal + taxAmount;

    const getSymbol = (code: string) => {
      switch (code?.toLowerCase()) {
        case "usd": return "$";
        case "eur": return "€";
        case "gbp":
        default: return "£";
      }
    };
    const symbol = getSymbol(currency);
    const formattedTotal = `${symbol}${total.toFixed(2)}`;

    // 3. Compile HTML Email Layout
    const itemsHtml = items.map((item: any) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; font-size: 13px; color: #334155;">${item.description || "Tutor Lesson"}</td>
        <td style="padding: 10px 0; font-size: 13px; color: #475569; text-align: right;">${item.hours}</td>
        <td style="padding: 10px 0; font-size: 13px; color: #475569; text-align: right;">${symbol}${Number(item.rate).toFixed(2)}</td>
        <td style="padding: 10px 0; font-size: 13px; font-weight: bold; color: #0f172a; text-align: right;">${symbol}${(Number(item.hours) * Number(item.rate)).toFixed(2)}</td>
      </tr>
    `).join("");

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceNumber}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
          
          <!-- Header -->
          <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top;">
                  <h2 style="margin: 0; font-size: 18px; color: #0f172a; font-weight: bold;">${senderBusiness || senderName}</h2>
                  <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">${senderName}</p>
                  ${senderAddress ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; white-space: pre-wrap; line-height: 1.4;">${senderAddress}</p>` : ""}
                  ${senderPhone ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">${senderPhone}</p>` : ""}
                </td>
                <td style="vertical-align: top; text-align: right;">
                  <span style="background: #eff6ff; color: #2563eb; font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em;">Invoice</span>
                  <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8; font-weight: 500;">Invoice Number</p>
                  <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: bold; color: #0f172a;">${invoiceNumber}</p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Billing Details -->
          <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top; width: 50%;">
                  <span style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Bill To:</span>
                  <h4 style="margin: 4px 0 0 0; font-size: 13px; color: #0f172a; font-weight: bold;">${clientName || "Client"}</h4>
                  ${clientAddress ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; white-space: pre-wrap; line-height: 1.4;">${clientAddress}</p>` : ""}
                </td>
                <td style="vertical-align: top; text-align: right; width: 50%;">
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">Date Issued</p>
                  <p style="margin: 2px 0 10px 0; font-size: 12px; font-weight: 600; color: #334155;">${issueDate ? new Date(issueDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}</p>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">Due Date</p>
                  <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: 600; color: #b91c1c;">${dueDate ? new Date(dueDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}</p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Message from Tutor -->
          ${message ? `
          <div style="background-color: #f8fafc; border-left: 3px solid #2563eb; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px; font-size: 13px; color: #334155; line-height: 1.5;">
            ${message.replace(/\n/g, "<br>")}
          </div>
          ` : ""}

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #94a3b8; text-align: left;">
                <th style="padding-bottom: 8px;">Description</th>
                <th style="padding-bottom: 8px; text-align: right; width: 60px;">Hours</th>
                <th style="padding-bottom: 8px; text-align: right; width: 80px;">Rate</th>
                <th style="padding-bottom: 8px; text-align: right; width: 90px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="margin-left: auto; width: 220px; border-top: 2px solid #e2e8f0; padding-top: 12px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Subtotal</td>
                <td style="padding: 4px 0; text-align: right; color: #334155;">${symbol}${subtotal.toFixed(2)}</td>
              </tr>
              ${Number(taxPercent) > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Tax (${taxPercent}%)</td>
                <td style="padding: 4px 0; text-align: right; color: #334155;">${symbol}${taxAmount.toFixed(2)}</td>
              </tr>
              ` : ""}
              <tr style="font-weight: bold; font-size: 15px; border-top: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #0f172a;">Total Due</td>
                <td style="padding: 8px 0; text-align: right; color: #2563eb;">${formattedTotal}</td>
              </tr>
            </table>
          </div>

          <!-- Payment Details -->
          ${paymentDetails ? `
          <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Payment Instructions</h4>
            <p style="margin: 0; font-size: 12px; color: #475569; white-space: pre-wrap; line-height: 1.5; font-family: monospace; background-color: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">${paymentDetails}</p>
          </div>
          ` : ""}

          <!-- Notes -->
          ${notes ? `
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px;">
            <h4 style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Notes</h4>
            <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.4;">${notes}</p>
          </div>
          ` : ""}

        </div>
      </body>
      </html>
    `;

    // 4. Set attachments
    const attachments = [];
    if (attachHtml) {
      attachments.push({
        filename: `invoice-${invoiceNumber}.html`,
        content: Buffer.from(invoiceHtml).toString("base64"),
      });
    }

    // 5. Send via Resend
    const success = await sendResendEmail({
      to: to.trim(),
      subject: subject || `Invoice ${invoiceNumber} from ${senderName}`,
      html: invoiceHtml,
      attachments
    });

    if (!success) {
      return NextResponse.json({ error: "Failed to send email. Verify Resend configurations." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/invoice/send] exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
  }
}
