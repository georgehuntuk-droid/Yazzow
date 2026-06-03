import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Create account · ${BRAND_NAME}`,
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Get started in minutes"
      subtitle="Free to join. Claim a phonetic username, share your private link, and let parents book and pay on your page alone."
    >
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthShell>
  );
}
