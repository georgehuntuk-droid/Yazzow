import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { isPlatformAdminUser } from "@/lib/auth/platform-admin";
import { requireUser } from "@/lib/auth/session";
import { getTutorProfileForUser, getTutorOnboardingStatus } from "@/lib/tutors/queries";
import { TutorOnboardingAssistant } from "@/components/dashboard/tutor-onboarding-assistant";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser({ redirectTo: "/dashboard" });
  const profile = await getTutorProfileForUser(user.id);

  if (!profile) {
    redirect("/onboarding");
  }

  if (profile.isBanned) {
    redirect("/banned");
  }

  let isAdmin = isPlatformAdminUser(user, profile);
  if (!isAdmin) {
    try {
      const cookieStore = await cookies();
      const adminSession = cookieStore.get("yazzow_admin_session")?.value;
      const adminPassword = process.env.ADMIN_PASSWORD || "yazzow-admin-2026";
      if (adminSession && adminSession === adminPassword) {
        isAdmin = true;
      }
    } catch {
      // ignore
    }
  }

  const onboardingStatus = await getTutorOnboardingStatus(profile.id);

  return (
    <div className="flex min-h-full flex-col bg-background lg:flex-row">
      <DashboardNav isAdmin={isAdmin} />
      <div className="flex min-h-full flex-1 flex-col">
        {children}
        <TutorOnboardingAssistant status={onboardingStatus} />
      </div>
    </div>
  );
}

