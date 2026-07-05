import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth/api-session";
import { createTutorSubscriptionCheckout } from "@/lib/stripe/subscription";
import { isStripeConfigured } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const user = await getApiUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let tier: "starter" | "growth" | "agency" | undefined = undefined;
  try {
    const body = await request.json();
    tier = body.tier;
  } catch {
    // ignore
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

  // Safe Diagnostic check to see exactly what key is loaded in memory
  const rawKey = process.env.STRIPE_SECRET_KEY || "";
  const keyLength = rawKey.length;
  const keyLast4 = rawKey.slice(-4);
  const isTestKey = rawKey.startsWith("sk_test_");
  const isLiveKey = rawKey.startsWith("sk_live_");

  try {
    const url = await createTutorSubscriptionCheckout({
      tutorId: user.id,
      email: user.email,
      existingCustomerId: profile.stripe_customer_id,
      tier,
    });
    return NextResponse.json({ url });
  } catch (error) {
    const stripeMessage = error instanceof Error ? error.message : "Checkout failed.";
    
    // Append the safe diagnostic info to the error message so we can verify the environment key immediately
    const diagnosticMessage = `${stripeMessage} (Server Key Diagnostics: Length: ${keyLength}, Last4: ${keyLast4}, Prefix: ${isTestKey ? "test" : isLiveKey ? "live" : "unknown"})`;
    
    return NextResponse.json({ error: diagnosticMessage }, { status: 500 });
  }
}
