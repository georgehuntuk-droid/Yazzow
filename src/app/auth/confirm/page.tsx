import { Suspense } from "react";

import { AuthConfirmClient } from "@/components/auth/auth-confirm-client";
import { AuthShell } from "@/components/layout/auth-shell";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Confirm email · ${BRAND_NAME}`,
};

export default function AuthConfirmPage() {
  return (
    <AuthShell title="Confirming your email" subtitle="Just a moment while we sign you in.">
      <Suspense fallback={<p className="text-center text-muted-foreground">Loading…</p>}>
        <AuthConfirmClient />
      </Suspense>
    </AuthShell>
  );
}
