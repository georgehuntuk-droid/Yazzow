import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { requireUser } from "@/lib/auth/session";
import { getTutorProfileForUser } from "@/lib/tutors/queries";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";

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

  const isAdmin = await isPlatformAdmin();

  return (
    <div className="flex min-h-full flex-col bg-background lg:flex-row">
      <DashboardNav isAdmin={isAdmin} />
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
    </div>
  );
}
