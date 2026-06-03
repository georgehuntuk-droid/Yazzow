import { AUTH_CALLBACK_ERRORS } from "@/lib/auth/messages";

type AuthErrorBannerProps = {
  code?: string | null;
};

export function AuthErrorBanner({ code }: AuthErrorBannerProps) {
  if (!code) return null;

  const message = AUTH_CALLBACK_ERRORS[code] ?? null;
  if (!message) return null;

  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}
