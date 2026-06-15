import { getSupabaseEnvHint, isSupabaseConfigured } from "@/lib/supabase/env";
import { hasSupabaseAdminKey } from "@/lib/supabase/admin-key";

export function AuthConfigNotice() {
  const supabaseConfigured = isSupabaseConfigured();
  const adminKeyConfigured = hasSupabaseAdminKey();

  if (supabaseConfigured && adminKeyConfigured) {
    return null;
  }

  if (!supabaseConfigured) {
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

  // Supabase is configured but admin key is missing
  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3.5 text-sm text-amber-950 dark:text-amber-100"
    >
      <p className="font-bold">⚠️ Server Key Missing</p>
      <p className="mt-1.5 leading-normal">
        The database secret key (<code className="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-[12px] font-bold">SUPABASE_SECRET_KEY</code>) is missing on the server.
      </p>
      <p className="mt-2 text-xs opacity-90 leading-relaxed">
        Signups and email confirmations will fail or hang. Please log in to your hosting provider (Vercel or Netlify) and add the environment variable <code className="font-mono bg-amber-500/20 px-1 rounded text-[11px] font-bold">SUPABASE_SECRET_KEY</code> set to the <strong>service_role</strong> API key from your Supabase dashboard.
      </p>
    </div>
  );
}

