import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are the Yazzow Support Assistant, a friendly and professional AI chatbot built to help tutors, parents, and pupils on the Yazzow platform.
Your goal is to answer queries quickly and accurately. If you cannot answer a query or if the user requests a human agent, politely guide them to escalate and submit a support ticket.

Knowledge Base:
1. Tutor Subscription Fees:
   - Tutors pay a monthly subscription fee to use Yazzow's CRM, scheduling, and billing tools.
   - Subscription can be cancelled at any time from Dashboard Settings -> Billing Portal.
   - Upon cancellation, the tutor portal remains active until the end of the current paid billing cycle.
   - Monthly subscription payments are non-refundable. For technical platform issues preventing service use, users can open a support ticket to request a discretionary partial refund.

2. Storefront Digital Resources (Worksheets):
   - Worksheets, study guides, and digital books sold through tutor storefronts are digital products delivered instantly via email download links upon checkout.
   - Because they are instantly downloadable, all digital storefront sales are strictly non-refundable.
   - For corrupted links or download issues, please contact Yazzow support or the tutor.

3. Lesson Credits & Credit Limits (Overdraft):
   - "Lesson credits" represents prepaid lessons. Tutors can reward students or give free lessons by "overriding" this count to a positive number.
   - "Credit Limit" is an "overdraft limit" set by tutors. It controls how many sessions a parent can book without prepayment.
   - If a student has 0 credits and a Credit Limit of 3, they can book up to 3 lessons (prepaid balance drops to -3). Once they hit this limit, further bookings are blocked until a payment is recorded.

4. General Guidance:
   - For login issues or forgotten passwords, use the "Forgot Password" link on the Login page.
   - Keep answers clear, concise, and structured in Markdown.
   - If the issue requires admin intervention (e.g. account verification, Stripe payout issues, payment disputes), recommend escalating by clicking the "Escalate to Support Ticket" button.
`;

// Simple keyword-based fallback if Gemini API Key is not configured
function getKeywordResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("refund") || q.includes("money back") || q.includes("refund policy")) {
    return `### Refund Policy Information 💳\n\n` +
      `- **Digital Storefront Resources (Worksheets):** Since digital files are instantly downloadable and cannot be returned, all digital storefront sales are **strictly non-refundable**.\n` +
      `- **Tutor Subscriptions:** Monthly subscription payments are generally **non-refundable**. If you experience technical platform issues that prevent you from using the service, please escalate to a support ticket to request a discretionary partial refund.\n` +
      `- **Lessons:** Refund policies for lessons are determined directly by your tutor's offline payment policies. Please get in touch with your tutor directly.`;
  }

  if (q.includes("cancel") || q.includes("stop subscription") || q.includes("billing")) {
    return `### Subscription & Billing Help 📂\n\n` +
      `- **How to cancel:** You can cancel your tutor subscription at any time by navigating to your **Dashboard Settings -> Billing Portal**.\n` +
      `- **After cancellation:** Your tutor portal remains active until the end of your current paid billing cycle.\n` +
      `- **Re-enabling:** You can resume your subscription at any time from the billing page before or after your cycle ends.`;
  }

  if (q.includes("credit") || q.includes("limit") || q.includes("overdraft") || q.includes("free lesson")) {
    return `### Lesson Credits & Overdraft Limits 🎓\n\n` +
      `- **Lesson Credits:** Represents prepaid lessons. If your tutor awards you free lessons, they will override your credit count (e.g., adding +5 credits).\n` +
      `- **Credit Limit (Overdraft):** Tutors can allow parents to book lessons without immediate payment by setting a **Credit Limit** (e.g. 3 lessons). This allows the credit count to go negative (down to -3). Once the overdraft is exceeded, bookings are blocked until payment is made.`;
  }

  if (q.includes("stripe") || q.includes("payout") || q.includes("connect") || q.includes("bank")) {
    return `### Stripe Connect & Payouts 🏦\n\n` +
      `- **Tutors:** Tutors must connect their Stripe account via **Dashboard Settings -> Payout Settings** to accept online card payments.\n` +
      `- **Processing Time:** Stripe payouts typically take 2-7 business days to settle in your bank account depending on your country.\n` +
      `- **Issues:** If your account is restricted or payouts are paused, please log into your Stripe Express dashboard or escalate this to our support team.`;
  }

  if (q.includes("bug") || q.includes("broken") || q.includes("error") || q.includes("load") || q.includes("not working")) {
    return `### Troubleshooting Technical Issues 🛠️\n\n` +
      `I'm sorry to hear you're experiencing a technical issue. Please try the following steps:\n` +
      `1. Refresh your web browser or try opening Yazzow in Incognito / Private mode.\n` +
      `2. Clear your browser cache and cookies.\n` +
      `3. Ensure your browser is updated to the latest version.\n\n` +
      `If the problem persists, please click **"Escalate to Support Ticket"** below so our tech team can review your case!`;
  }

  return `### Hello! How can I help you? 👋\n\n` +
    `I am the Yazzow Support Assistant. I can help answer questions regarding:\n` +
    `- **Tutor subscription cancellations & refund terms**\n` +
    `- **Storefront worksheet refund policies**\n` +
    `- **How lesson credits and overdraft limits work**\n` +
    `- **Stripe payout setups**\n\n` +
    `What would you like to know? If you have a specific technical error, you can also escalate this to a support ticket at any time!`;
}

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as {
      messages?: { role: "user" | "model"; content: string }[];
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      // Return local intelligent fallback response
      const reply = getKeywordResponse(lastMessage);
      // Simulate typing delay in development
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json({ reply });
    }

    // Call Gemini API
    const formattedContents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: formattedContents,
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API call failed:", response.status, errorText);
      // Fallback to keyword-based response if API call fails
      const reply = getKeywordResponse(lastMessage);
      return NextResponse.json({ reply });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      throw new Error("Empty response from Gemini API");
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Support chat endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error during chat processing." },
      { status: 500 }
    );
  }
}
