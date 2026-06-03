import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthConfigNotice } from "@/components/auth/auth-config-notice";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { BRAND_NAME } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: `New password · ${BRAND_NAME}`,
};

export default async function ResetPasswordPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/forgot-password");
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Use the link from your email. Once saved, you'll go straight to your dashboard."
    >
      <AuthConfigNotice />
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
