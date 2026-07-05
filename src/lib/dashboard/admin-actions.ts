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

  // Retrieve stripe customer & subscription ID from profile before deleting
  const { data: tutor } = await admin
    .from("tutor_profiles")
    .select("stripe_subscription_id")
    .eq("id", tutorId)
    .maybeSingle();

  // Cancel Stripe Subscription immediately if active
  if (tutor?.stripe_subscription_id) {
    try {
      const { getStripe, isStripeConfigured } = await import("@/lib/stripe/server");
      if (isStripeConfigured()) {
        const stripe = getStripe();
        await stripe.subscriptions.cancel(tutor.stripe_subscription_id);
      }
    } catch (err) {
      console.error("Failed to cancel Stripe subscription immediately during tutor deletion:", tutorId, err);
    }
  }
  
  // 1. Clean up tutor's files in worksheets storage bucket
  try {
    const { data: files, error: listErr } = await admin.storage.from("worksheets").list(tutorId);
    if (!listErr && files && files.length > 0) {
      const paths = files.map((f) => `${tutorId}/${f.name}`);
      await admin.storage.from("worksheets").remove(paths);
    }
  } catch (err) {
    console.error("Worksheets storage cleanup failed for tutorId:", tutorId, err);
  }

  // 2. Delete auth user (cascades to public.tutor_profiles via foreign key)
  const { error } = await admin.auth.admin.deleteUser(tutorId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true as const };
}

/** Toggles a tutor's administrative ban/suspension status. */
export async function toggleTutorBanStatus(tutorId: string, isBanned: boolean) {
  await requireAdmin();

  const admin = createAdminClient();

  if (isBanned) {
    // Retrieve stripe subscription ID from profile to cancel it
    const { data: tutor } = await admin
      .from("tutor_profiles")
      .select("stripe_subscription_id")
      .eq("id", tutorId)
      .maybeSingle();

    // Cancel Stripe Subscription immediately if active
    if (tutor?.stripe_subscription_id) {
      try {
        const { getStripe, isStripeConfigured } = await import("@/lib/stripe/server");
        if (isStripeConfigured()) {
          const stripe = getStripe();
          await stripe.subscriptions.cancel(tutor.stripe_subscription_id);
        }
      } catch (err) {
        console.error("Failed to cancel Stripe subscription immediately during tutor ban:", tutorId, err);
      }
    }

    // Mark subscription status as cancelled in database when banned
    await admin
      .from("tutor_profiles")
      .update({ 
        subscription_status: "canceled",
        stripe_subscription_id: null
      })
      .eq("id", tutorId);
  }

  const { error } = await admin
    .from("tutor_profiles")
    .update({ is_banned: isBanned })
    .eq("id", tutorId);

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

/** Allows an admin to edit a tutor's profile details on their behalf. */
export async function adminUpdateTutorProfile(tutorId: string, payload: {
  displayName: string;
  username: string;
  currency: string;
  lessonPriceCents: number;
  paymentInstructions?: string | null;
  avatarUrl?: string | null;
  subscriptionTier?: string;
}) {
  await requireAdmin();

  const admin = createAdminClient();
  const updatePayload: any = {
    display_name: payload.displayName.trim(),
    username: payload.username.trim().toLowerCase(),
    currency: payload.currency.trim().toLowerCase(),
    lesson_price_cents: payload.lessonPriceCents,
    payment_instructions: payload.paymentInstructions?.trim() || null,
    avatar_url: payload.avatarUrl !== undefined ? payload.avatarUrl : undefined,
  };

  if (payload.subscriptionTier !== undefined) {
    updatePayload.subscription_tier = payload.subscriptionTier;
  }

  const { error } = await admin
    .from("tutor_profiles")
    .update(updatePayload)
    .eq("id", tutorId);

  if (error) {
    const isTierError =
      error.message.includes("subscription_tier") ||
      error.message.includes("schema cache") ||
      error.code === "42703";

    if (isTierError && payload.subscriptionTier === undefined) {
      // Safe to retry without tier as it wasn't requested anyway
      delete updatePayload.subscription_tier;
      const { error: retryError } = await admin
        .from("tutor_profiles")
        .update(updatePayload)
        .eq("id", tutorId);

      if (retryError) {
        return { ok: false as const, error: retryError.message };
      }
    } else {
      // If tier was explicitly requested, or it is a different error, do not fail silently
      let errMsg = error.message;
      if (isTierError) {
        errMsg = `${error.message}. Please run the query "NOTIFY pgrst, 'reload schema';" in your Supabase SQL Editor to refresh the cache.`;
      }
      return { ok: false as const, error: errMsg };
    }
  }

  revalidatePath("/admin");
  return { ok: true as const };
}

/** Deletes all bookings and availability slots for a tutor to clear their schedule. */
export async function clearTutorScheduleAction(tutorId: string) {
  await requireAdmin();

  const admin = createAdminClient();

  // 1. Delete bookings first (due to foreign key reference constraint)
  const { error: bookingsErr } = await admin
    .from("bookings")
    .delete()
    .eq("tutor_id", tutorId);

  if (bookingsErr) {
    return { ok: false as const, error: bookingsErr.message };
  }

  // 2. Delete availability slots
  const { error: slotsErr } = await admin
    .from("availability_slots")
    .delete()
    .eq("tutor_id", tutorId);

  if (slotsErr) {
    return { ok: false as const, error: slotsErr.message };
  }

  revalidatePath("/admin");
  return { ok: true as const };
}

/** Creates a new platform admin notice/announcement. */
export async function createAdminNoticeAction(title: string, content: string) {
  await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("admin_notices")
    .insert({
      title: title.trim(),
      content: content.trim(),
    });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

/** Deletes a platform admin notice/announcement. */
export async function deleteAdminNoticeAction(noticeId: string) {
  await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("admin_notices")
    .delete()
    .eq("id", noticeId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

/** Sends an email reply back to the support ticket author. */
export async function replyToSupportTicketAction(payload: {
  ticketId: string;
  name: string;
  email: string;
  category: string;
  originalMessage: string;
  replyMessage: string;
}) {
  await requireAdmin();

  // 1. Send the email via Resend
  const { sendSupportTicketReplyEmail } = await import("@/lib/notifications/support-email");
  
  try {
    await sendSupportTicketReplyEmail(payload);
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }

  // 2. Append reply details to the admin notes in database for audit logs
  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("admin_notes")
    .eq("id", payload.ticketId)
    .maybeSingle();

  const timestamp = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const newNotes = [
    ticket?.admin_notes || "",
    `--- Sent Reply (${timestamp}) ---\n${payload.replyMessage.trim()}`
  ].filter(Boolean).join("\n\n");

  const { error } = await admin
    .from("support_tickets")
    .update({ 
      admin_notes: newNotes, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", payload.ticketId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true as const };
}

