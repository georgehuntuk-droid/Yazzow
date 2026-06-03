import { getSupabaseEnvHint, isSupabaseConfigured } from "@/lib/supabase/env";

export function AuthConfigNotice() {
  if (isSupabaseConfigured()) {
    return null;
  }

  const hint = getSupabaseEnvHint();

  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
    >
      <p className="font-medium">Sign-in is not set up on this server yet.</p>
      <p className="mt-2 leading-relaxed">{hint}</p>
      <p className="mt-3 text-xs opacity-90">
        Tip: use{" "}
        <code className="rounded bg-amber-500/15 px-1">SUPABASE_URL</code> and{" "}
        <code className="rounded bg-amber-500/15 px-1">SUPABASE_ANON_KEY</code> on Netlify — they
        apply immediately after deploy without needing the{" "}
        <code className="rounded bg-amber-500/15 px-1">NEXT_PUBLIC_</code> prefix for server
        sign-in.
      </p>
    </div>
  );
}
