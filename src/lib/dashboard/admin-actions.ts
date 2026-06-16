"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
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

  revalidatePath("/admin");
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

  revalidatePath("/admin");
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

  revalidatePath("/admin");
  return { ok: true as const };
}

/** Updates an in-house support ticket status ('open', 'resolved', 'closed'). */
export async function updateSupportTicketStatus(ticketId: string, status: "open" | "resolved" | "closed") {
  await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true as const };
}

/** Updates internal admin notes on a support ticket. */
export async function updateSupportTicketNotes(ticketId: string, notes: string) {
  await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("support_tickets")
    .update({ admin_notes: notes.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true as const };
}

/** Deletes a support ticket record completely. */
export async function deleteSupportTicket(ticketId: string) {
  await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("support_tickets")
    .delete()
    .eq("id", ticketId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true as const };
}

/** Authenticates the user as an admin using a custom password/passphrase. */
export async function loginAsAdmin(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && password === adminPassword) {
    const cookieStore = await cookies();
    cookieStore.set("yazzow_admin_session", adminPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    return { ok: true as const };
  }
  return { ok: false as const, error: "Incorrect admin password" };
}

/** Deletes the admin session cookie, logging the user out. */
export async function logoutAsAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("yazzow_admin_session");
  return { ok: true as const };
}
