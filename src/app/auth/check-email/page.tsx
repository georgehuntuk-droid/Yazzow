import { Suspense } from "react";

import { AuthConfigNotice } from "@/components/auth/auth-config-notice";
import { CheckEmailPanel } from "@/components/auth/check-email-panel";
import { AuthShell } from "@/components/layout/auth-shell";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Check your email · ${BRAND_NAME}`,
};

export default function CheckEmailPage() {
  return (
    <AuthShell
      title="Almost there"
      subtitle="Confirm your email to finish creating your Yazzow account and claim your portal link."
    >
      <AuthConfigNotice />
      <Suspense>
        <CheckEmailPanel />
      </Suspense>
    </AuthShell>
  );
}
