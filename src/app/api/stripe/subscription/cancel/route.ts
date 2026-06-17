import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth/api-session";
import { cancelTutorSubscription } from "@/lib/stripe/subscription";
import { isStripeConfigured } from "@/lib/stripe/server";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await cancelTutorSubscription(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not cancel subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
