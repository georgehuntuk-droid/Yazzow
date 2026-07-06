import { redirect } from "next/navigation";

import { safeGetAuthUser } from "@/lib/supabase/server";
import { getTutorProfileForUser } from "@/lib/tutors/queries";

type RequireUserOptions = {
  /** Where to send the user after sign-in if they are not authenticated. */
  redirectTo?: string;
};

export async function requireUser(options?: RequireUserOptions) {
  const user = await safeGetAuthUser();

  if (!user) {
    const next = options?.redirectTo ?? "/dashboard";
    redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  }

  if (user.email) {
    const { isUserBanned } = await import("@/lib/auth/ban-check");
    const banned = await isUserBanned(user.email, user.id);
    if (banned) {
      redirect("/banned");
    }
  }

  return user;
}

export async function requireTutorProfile(options?: RequireUserOptions) {
  const user = await requireUser(options);
  const profile = await getTutorProfileForUser(user.id);

  if (!profile) {
    redirect("/onboarding");
  }

  if (profile.isBanned) {
    redirect("/banned");
  }

  return { user, profile };
}
