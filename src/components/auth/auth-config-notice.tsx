import { authConfigErrorMessage } from "@/lib/auth/messages";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AuthConfigNotice() {
  if (isSupabaseConfigured()) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
    >
      {authConfigErrorMessage()}
    </div>
  );
}
