import { NextResponse } from "next/server";

import {
  isSupportEmailConfigured,
  sendSupportTicketEmail,
} from "@/lib/notifications/support-email";

const CATEGORIES = new Set(["bug", "billing", "account", "feature", "other"]);

export async function POST(request: Request) {
  if (!isSupportEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Online support is not wired yet. Email us directly — the address is shown on the support page.",
      },
      { status: 503 },
    );
  }

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
    await sendSupportTicketEmail({ name, email, category, message, source: body.source });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Could not send ticket.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
