import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthConfigNotice } from "@/components/auth/auth-config-notice";
import { AuthShell } from "@/components/layout/auth-shell";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Reset password · ${BRAND_NAME}`,
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll email you a secure link to set a new password and get back into your dashboard."
    >
      <AuthConfigNotice />
      <ForgotPasswordForm />
    </AuthShell>
  );
}
