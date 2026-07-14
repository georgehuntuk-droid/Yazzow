import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type MarketingAuthCta = {
  href: string;
  label: string;
};

export async function getMarketingAuthCta(user?: any): Promise<MarketingAuthCta> {
  if (!isSupabaseConfigured()) {
    return { href: "/auth/signup", label: "Get started free" };
  }

  // If user is passed (including null), use it; otherwise, fetch it
  const activeUser = user !== undefined ? user : await (async () => {
    try {
      const supabase = await createClient();
      const { data: { user: fetchedUser } } = await supabase.auth.getUser();
      return fetchedUser;
    } catch {
      return null;
    }
  })();

  if (activeUser) {
    return { href: "/dashboard/payments", label: "Subscribe in dashboard" };
  }

  return { href: "/auth/signup", label: "Try a 14-day free trial now" };
}
