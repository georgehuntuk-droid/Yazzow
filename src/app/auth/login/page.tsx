import { Suspense } from "react";

import { AuthConfigNotice } from "@/components/auth/auth-config-notice";
import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Sign in · ${BRAND_NAME}`,
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <AuthShell
      title="Welcome back to Yazzow"
      subtitle="Sign in to manage your schedule, storefront, and student ledger from one calm workspace."
    >
      <AuthConfigNotice />
      <AuthErrorBanner code={error} />
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
