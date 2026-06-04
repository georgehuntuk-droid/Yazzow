import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type MarketingAuthCta = {
  href: string;
  label: string;
};

export async function getMarketingAuthCta(): Promise<MarketingAuthCta> {
  if (!isSupabaseConfigured()) {
    return { href: "/auth/signup", label: "Get started free" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { href: "/dashboard/payments", label: "Subscribe in dashboard" };
  }

  return { href: "/auth/signup", label: "Get started free" };
}
