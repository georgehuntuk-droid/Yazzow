import { OnboardingForm } from "@/components/auth/onboarding-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { requireUser } from "@/lib/auth/session";
import { getTutorProfileForUser } from "@/lib/tutors/queries";
import { redirect } from "next/navigation";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Set up your portal · ${BRAND_NAME}`,
};

export default async function OnboardingPage() {
  const user = await requireUser({ redirectTo: "/onboarding" });
  const existing = await getTutorProfileForUser(user.id);

  if (existing) {
    redirect("/dashboard");
  }

  const defaultDisplayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Tutor";

  return (
    <AuthShell
      title="Claim your portal link"
      subtitle="Choose a username parents can remember. This becomes your private booking page — never listed in a marketplace."
    >
      <OnboardingForm defaultDisplayName={defaultDisplayName} />
    </AuthShell>
  );
}
