import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getApiUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
