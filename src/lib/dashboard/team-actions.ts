"use server";

import { revalidatePath } from "next/cache";
import { requireTutorProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type TeamMember = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  lessonPriceCents: number;
  currency: string;
  studentCount?: number;
  lessonCount?: number;
};

export type PendingInvitation = {
  id: string;
  email: string;
  createdAt: string;
};

/**
 * Invites a new employee tutor to join the Academy.
 * Only allowed for tutors with the 'academy' subscription tier.
 */
export async function inviteTeamMember(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { profile } = await requireTutorProfile();
    const formattedEmail = email.trim().toLowerCase();
    if (!formattedEmail) {
      return { ok: false, error: "Email address is required." };
    }

    const { getTutorSubscriptionState } = await import("@/lib/stripe/subscription");
    const subState = await getTutorSubscriptionState(profile.id);
    const tier = subState.subscriptionTier;

    // Check tier (also allow legacy agency)
    if (tier !== "academy" && tier !== "agency") {
      return { ok: false, error: "Only Academy plan subscribers can manage staff sub-accounts." };
    }

    const supabase = await createClient();

    // 1. UNIQUE PROTECTION: Check if email is already registered in auth.users
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: usersData } = await admin.auth.admin.listUsers();
    const existingUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === formattedEmail
    );

    if (existingUser) {
      return { ok: false, error: "This email is already associated with an active Yazzow account." };
    }

    // 2. HARD SEAT LIMIT CHECK: Check allowed seat count vs active staff count
    const { count: activeCount, error: activeErr } = await supabase
      .from("tutor_profiles")
      .select("id", { count: "exact", head: true })
      .eq("academy_id", profile.id)
      .eq("role", "staff_tutor");

    if (activeErr) {
      throw new Error(activeErr.message);
    }

    const { data: academyProfile } = await supabase
      .from("tutor_profiles")
      .select("additional_purchased_seats")
      .eq("id", profile.id)
      .single();

    const additionalSeats = academyProfile?.additional_purchased_seats || 0;
    const MAX_INCLUDED_SEATS = 5;
    const totalAllowedSeats = MAX_INCLUDED_SEATS + additionalSeats;

    if ((activeCount || 0) >= totalAllowedSeats) {
      return { ok: false, error: "Seat limit reached. Upgrade your plan to add more staff." };
    }

    const { error } = await supabase
      .from("academy_invitations")
      .insert({
        academy_id: profile.id,
        email: formattedEmail,
        status: "pending",
      });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "This email has already been invited to your academy." };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath("/dashboard/team");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Removes an employee tutor from the Academy, resetting their parent relationship.
 */
export async function removeTeamMember(memberId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { profile } = await requireTutorProfile();
    const supabase = await createClient();

    const { error } = await supabase
      .from("tutor_profiles")
      .update({ parent_academy_id: null, academy_id: null, role: 'independent' })
      .eq("id", memberId)
      .or(`parent_academy_id.eq.${profile.id},academy_id.eq.${profile.id}`);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/dashboard/team");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Fetches all employee tutors currently linked to this Academy, with stats.
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const { profile } = await requireTutorProfile();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tutor_profiles")
      .select("id, username, display_name, avatar_url, headline, lesson_price_cents, currency")
      .eq("parent_academy_id", profile.id);

    if (error) {
      throw new Error(error.message);
    }

    const members = data || [];
    if (members.length === 0) return [];

    const memberIds = members.map((m) => m.id);

    // Fetch student and monthly lesson counts
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const [studentsRes, bookingsRes] = await Promise.all([
      supabase.from("students").select("tutor_id").in("tutor_id", memberIds),
      supabase.from("bookings").select("tutor_id").in("tutor_id", memberIds).gte("created_at", startOfMonth),
    ]);

    const studentMap = new Map();
    studentsRes.data?.forEach((s: any) => {
      studentMap.set(s.tutor_id, (studentMap.get(s.tutor_id) || 0) + 1);
    });

    const bookingMap = new Map();
    bookingsRes.data?.forEach((b: any) => {
      bookingMap.set(b.tutor_id, (bookingMap.get(b.tutor_id) || 0) + 1);
    });

    return members.map((row: any) => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      headline: row.headline,
      lessonPriceCents: row.lesson_price_cents,
      currency: row.currency,
      studentCount: studentMap.get(row.id) || 0,
      lessonCount: bookingMap.get(row.id) || 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetches all pending staff invitations for this Academy.
 */
export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  try {
    const { profile } = await requireTutorProfile();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("academy_invitations")
      .select("id, email, created_at")
      .eq("academy_id", profile.id)
      .eq("status", "pending");

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      email: row.email,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Cancels a pending staff invitation.
 */
export async function cancelInvitation(inviteId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { profile } = await requireTutorProfile();
    const supabase = await createClient();

    const { error } = await supabase
      .from("academy_invitations")
      .delete()
      .eq("id", inviteId)
      .eq("academy_id", profile.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/dashboard/team");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function getAcademyStudents(): Promise<Array<{ id: string; studentName: string; parentEmail: string; tutorId: string; tutorName: string }>> {
  try {
    const { profile } = await requireTutorProfile();
    const supabase = await createClient();

    // 1. Get all staff member IDs
    const { data: staff } = await supabase
      .from("tutor_profiles")
      .select("id, display_name")
      .or(`parent_academy_id.eq.${profile.id},academy_id.eq.${profile.id}`);

    const tutorIds = [profile.id, ...(staff || []).map((s) => s.id)];
    const staffMap = new Map(tutorIds.map(id => [id, id === profile.id ? "Me (Owner)" : (staff?.find(s => s.id === id)?.display_name || "Staff")]));

    // 2. Get students for all these tutor IDs
    const { data: students, error } = await supabase
      .from("students")
      .select("id, student_name, parent_email, tutor_id")
      .in("tutor_id", tutorIds);

    if (error) throw new Error(error.message);

    return (students || []).map((s) => ({
      id: s.id,
      studentName: s.student_name,
      parentEmail: s.parent_email,
      tutorId: s.tutor_id,
      tutorName: staffMap.get(s.tutor_id) || "Staff",
    }));
  } catch (err) {
    console.error("Failed to load academy students:", err);
    return [];
  }
}

export async function reassignStudent(studentId: string, newTutorId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { profile } = await requireTutorProfile();
    const supabase = await createClient();

    // Verify newTutorId is either the owner or linked staff
    const { data: staff } = await supabase
      .from("tutor_profiles")
      .select("id")
      .or(`parent_academy_id.eq.${profile.id},academy_id.eq.${profile.id}`);

    const allowedIds = [profile.id, ...(staff || []).map((s) => s.id)];
    if (!allowedIds.includes(newTutorId)) {
      return { ok: false, error: "Tutor is not a member of your Academy." };
    }

    // Update students table
    const { error } = await supabase
      .from("students")
      .update({ tutor_id: newTutorId })
      .eq("id", studentId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/dashboard/team");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function getAcademyScheduleEvents(): Promise<Array<{ id: string; tutorName: string; startsAt: string; endsAt: string; isBooked: boolean; title: string }>> {
  try {
    const { profile } = await requireTutorProfile();
    const supabase = await createClient();

    // 1. Get all staff member IDs
    const { data: staff } = await supabase
      .from("tutor_profiles")
      .select("id, display_name")
      .or(`parent_academy_id.eq.${profile.id},academy_id.eq.${profile.id}`);

    const tutorIds = [profile.id, ...(staff || []).map((s) => s.id)];
    const staffMap = new Map(tutorIds.map(id => [id, id === profile.id ? "Me (Owner)" : (staff?.find(s => s.id === id)?.display_name || "Staff")]));

    // 2. Fetch all slots for these tutors
    const { data: slots, error } = await supabase
      .from("availability_slots")
      .select("id, starts_at, ends_at, is_booked, tutor_id")
      .in("tutor_id", tutorIds)
      .order("starts_at", { ascending: true });

    if (error) throw new Error(error.message);

    return (slots || []).map((s) => ({
      id: s.id,
      tutorName: staffMap.get(s.tutor_id) || "Staff",
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      isBooked: s.is_booked === true,
      title: `${staffMap.get(s.tutor_id)} - ${s.is_booked ? "🔒 Booked" : "🟢 Available"}`,
    }));
  } catch (err) {
    console.error("Failed to load academy calendar:", err);
    return [];
  }
}

export async function getAcademyPendingReports(): Promise<Array<{ id: string; studentName: string; parentEmail: string; tutorName: string; feedback: string; startsAt: string }>> {
  try {
    const { profile } = await requireTutorProfile();
    const supabase = await createClient();

    // 1. Get all staff member IDs
    const { data: staff } = await supabase
      .from("tutor_profiles")
      .select("id, display_name")
      .or(`parent_academy_id.eq.${profile.id},academy_id.eq.${profile.id}`);

    const tutorIds = [profile.id, ...(staff || []).map((s) => s.id)];
    const staffMap = new Map(tutorIds.map(id => [id, id === profile.id ? "Me (Owner)" : (staff?.find(s => s.id === id)?.display_name || "Staff")]));

    // 2. Fetch bookings where tutor_id in tutorIds, feedback_status is 'pending_review'
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        parent_email,
        student_name,
        tutor_lesson_feedback,
        tutor_id,
        availability_slots (starts_at)
      `)
      .in("tutor_id", tutorIds)
      .eq("feedback_status", "pending_review")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (bookings || []).map((b) => {
      const slot = Array.isArray(b.availability_slots) ? b.availability_slots[0] : b.availability_slots;
      return {
        id: b.id,
        studentName: b.student_name || "GCSE Student",
        parentEmail: b.parent_email,
        tutorName: staffMap.get(b.tutor_id) || "Staff",
        feedback: b.tutor_lesson_feedback || "",
        startsAt: slot?.starts_at || "",
      };
    });
  } catch (err) {
    console.error("Failed to load academy pending reports:", err);
    return [];
  }
}
