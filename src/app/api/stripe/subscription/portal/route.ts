import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth/api-session";
import {
  createTutorBillingPortalSession,
  getTutorSubscriptionState,
} from "@/lib/stripe/subscription";
import { isStripeConfigured } from "@/lib/stripe/server";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getTutorSubscriptionState(user.id);

  if (!subscription.active || !subscription.stripeCustomerId) {
    return NextResponse.json(
      { error: "Subscribe first using the button above." },
      { status: 400 },
    );
  }

  try {
    const url = await createTutorBillingPortalSession(subscription.stripeCustomerId);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
