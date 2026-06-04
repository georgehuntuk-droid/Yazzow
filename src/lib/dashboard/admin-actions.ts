"use server";

import { revalidatePath } from "next/cache";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";

/** Guards any administrative action to ensure the current session is an admin. */
async function requireAdmin() {
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    throw new Error("Access Denied: You do not have permission to perform this action.");
  }
}

/** Toggles or updates a tutor's subscription status manually. */
export async function updateTutorSubscriptionStatus(tutorId: string, status: string) {
  await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("tutor_profiles")
    .update({ subscription_status: status })
    .eq("id", tutorId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard/admin");
  return { ok: true as const };
}

/** Sets a tutor's custom subscription current period end date. */
export async function updateTutorSubscriptionEndDate(tutorId: string, isoDate: string | null) {
  await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("tutor_profiles")
    .update({ subscription_current_period_end: isoDate })
    .eq("id", tutorId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard/admin");
  return { ok: true as const };
}

/** Deletes a tutor profile and their auth user completely. */
export async function deleteTutorProfileAndUser(tutorId: string) {
  await requireAdmin();

  const admin = createAdminClient();
  
  // 1. Delete auth user (cascades to public.tutor_profiles via foreign key)
  const { error } = await admin.auth.admin.deleteUser(tutorId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard/admin");
  return { ok: true as const };
}
