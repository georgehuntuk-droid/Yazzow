import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { requireUser } from "@/lib/auth/session";
import { getTutorProfileForUser } from "@/lib/tutors/queries";

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

  return (
    <div className="flex min-h-full flex-col bg-background lg:flex-row">
      <DashboardNav />
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
    </div>
  );
}
