import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth/api-session";
import { createClient } from "@/lib/supabase/server";
import {
  createExpressAccount,
  createExpressDashboardLink,
  createOnboardingLink,
  getConnectStatus,
} from "@/lib/stripe/connect";
import { isStripeConfigured } from "@/lib/stripe/server";

export async function GET() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ configured: false, status: null });
  }

  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("tutor_profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .maybeSingle();

  const status = await getConnectStatus(profile?.stripe_account_id);
  return NextResponse.json({ configured: true, status });
}

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add STRIPE_SECRET_KEY to Netlify environment variables (or .env.local locally), then redeploy.",
      },
      { status: 503 },
    );
  }

  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("tutor_profiles")
    .select("stripe_account_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
  }

  let accountId = profile.stripe_account_id;

  if (!accountId) {
    accountId = await createExpressAccount(user.email ?? `${profile.display_name}@Yazzow.app`);
    await supabase
      .from("tutor_profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);
  }

  const status = await getConnectStatus(accountId);

  if (status.ready) {
    const dashboardUrl = await createExpressDashboardLink(accountId);
    return NextResponse.json({ url: dashboardUrl, type: "dashboard" });
  }

  const onboardingUrl = await createOnboardingLink(accountId);
  return NextResponse.json({ url: onboardingUrl, type: "onboarding" });
}
