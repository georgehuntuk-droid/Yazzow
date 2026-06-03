import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth/api-session";
import { createTutorSubscriptionCheckout } from "@/lib/stripe/subscription";
import { isStripeConfigured } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const user = await getApiUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("tutor_profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
  }

  try {
    const url = await createTutorSubscriptionCheckout({
      tutorId: user.id,
      email: user.email,
      existingCustomerId: profile.stripe_customer_id,
    });
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
