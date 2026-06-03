import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Sign in · ${BRAND_NAME}`,
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back to Yazzow"
      subtitle="Sign in to manage your schedule, storefront, and student ledger from one calm workspace."
    >
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
