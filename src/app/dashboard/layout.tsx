import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { isPlatformAdminUser } from "@/lib/auth/platform-admin";
import { requireUser } from "@/lib/auth/session";
import { getTutorProfileForUser } from "@/lib/tutors/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const isAdmin = isPlatformAdminUser(user, profile);

  return (
    <div className="flex min-h-full flex-col bg-background lg:flex-row">
      <DashboardNav isAdmin={isAdmin} />
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
    </div>
  );
}
