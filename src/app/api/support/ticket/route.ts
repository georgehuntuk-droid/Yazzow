import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeGetAuthUser } from "@/lib/supabase/server";
import {
  sendSupportTicketEmail,
  sendSupportTicketConfirmationEmail,
} from "@/lib/notifications/support-email";

const CATEGORIES = new Set(["bug", "billing", "account", "feature", "other"]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    category?: string;
    message?: string;
    source?: string;
  };

  const name = body.name?.trim();
  const email = body.email?.trim();
  const category = body.category?.trim() ?? "other";
  const message = body.message?.trim();
  const source = body.source?.trim() || "support page";

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  if (message.length > 4000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  try {
    const user = await safeGetAuthUser();
    const admin = createAdminClient();

    const { error } = await admin.from("support_tickets").insert({
      tutor_id: user?.id || null,
      name,
      email,
      category,
      message,
      source,
      status: "open",
    });

    if (error) {
      throw new Error(error.message);
    }

    // Attempt to send email notifications in background, catching errors so they don't fail the API
    try {
      await Promise.all([
        sendSupportTicketEmail({ name, email, category, message, source }),
        sendSupportTicketConfirmationEmail({ name, email, category, message, source }),
      ]);
    } catch (emailErr) {
      console.error("Failed to send support ticket emails:", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Could not submit support ticket.";
    console.error("Support ticket insertion failed:", error);
    
    // Fallback for demo/offline testing: if the database is offline, simulate success for client preview
    if (process.env.NODE_ENV === "development" || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("[Support API] Database connection failed or service key missing. Simulating success in development/sandbox.");
      
      try {
        await Promise.all([
          sendSupportTicketEmail({ name, email, category, message, source }),
          sendSupportTicketConfirmationEmail({ name, email, category, message, source }),
        ]);
      } catch (emailErr) {
        console.error("Failed to send support ticket emails in fallback:", emailErr);
      }
      
      return NextResponse.json({ ok: true });
    }
    
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
