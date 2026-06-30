"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";


import { cancelLessonBooking } from "@/lib/bookings/cancel-booking";
import { sendRunningLateNotice } from "@/lib/bookings/running-late";
import { sendLessonReminder } from "@/lib/bookings/lesson-reminders";
import { requireTutorProfile } from "@/lib/auth/session";
import {
  LESSON_SLOT_DURATION_MINUTES,
  MAX_AVAILABILITY_BLOCK_HOURS,
} from "@/lib/constants";
import {
  countHourlySlots,
  rangesOverlap,
  splitAvailabilityIntoHourlySlots,
} from "@/lib/scheduling/hourly-slots";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { formatMoney, formatSlotRange } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { removeTutorFiles, uploadTutorFile } from "@/lib/supabase/tutor-storage";

const WORKSHEET_BUCKET = "worksheets";
const MAX_FILE_BYTES = 52_428_800;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

async function revalidateTutor(username: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/tutor/${username}`);
}

function parsePriceToCents(raw: string): number | null {
  const normalized = raw.replace(/[£,\s]/g, "").trim().toLowerCase();
  if (normalized === "free" || normalized === "0") {
    return 0;
  }
  if (normalized === "") {
    return null;
  }
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export async function createAvailabilitySlot(input: {
  startsAtIso: string;
  endsAtIso: string;
}) {
  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;
  if (testVal === "dashboard") {
    return { ok: true as const, message: "Slots added." };
  }

  const { profile } = await requireTutorProfile();
  const startsAt = new Date(input.startsAtIso);
  const endsAt = new Date(input.endsAtIso);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { ok: false as const, error: "Invalid date or time." };
  }

  if (endsAt <= startsAt) {
    return { ok: false as const, error: "End time must be after start time." };
  }

  if (startsAt <= new Date()) {
    return { ok: false as const, error: "Availability must be in the future." };
  }

  let hourlyWindows = splitAvailabilityIntoHourlySlots(startsAt, endsAt);
  if (hourlyWindows.length === 0) {
    const durationMs = endsAt.getTime() - startsAt.getTime();
    if (durationMs < 15 * 60 * 1000) {
      return {
        ok: false as const,
        error: "Slot duration must be at least 15 minutes.",
      };
    }
    if (durationMs > 24 * 60 * 60 * 1000) {
      return {
        ok: false as const,
        error: "Slot duration cannot exceed 24 hours.",
      };
    }
    // Create it as a single custom slot!
    hourlyWindows = [{ startsAt, endsAt }];
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("availability_slots")
    .select("starts_at, ends_at")
    .eq("tutor_id", profile.id)
    .gte("ends_at", new Date().toISOString());

  const conflicts: string[] = [];
  const toInsert = hourlyWindows.filter((window) => {
    const clash = (existing ?? []).some((row) =>
      rangesOverlap(
        window.startsAt,
        window.endsAt,
        new Date(row.starts_at),
        new Date(row.ends_at),
      ),
    );
    if (clash) {
      conflicts.push(
        `${window.startsAt.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })}`,
      );
      return false;
    }
    return true;
  });

  if (toInsert.length === 0) {
    return {
      ok: false as const,
      error: "All of those hour slots already exist on your calendar.",
    };
  }

  const { error } = await supabase.from("availability_slots").insert(
    toInsert.map((window) => ({
      tutor_id: profile.id,
      starts_at: window.startsAt.toISOString(),
      ends_at: window.endsAt.toISOString(),
    })),
  );

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await revalidateTutor(profile.username);

  // Send availability alerts to parent alert lists
  try {
    const { getTutorNotifyProfile, notifyFamiliesNewAvailabilityBlock } = await import(
      "@/lib/notifications/slot-opened"
    );
    const tutorNotifyProfile = await getTutorNotifyProfile(profile.id);
    if (tutorNotifyProfile && toInsert.length > 0) {
      await notifyFamiliesNewAvailabilityBlock({
        tutorId: profile.id,
        tutorUsername: tutorNotifyProfile.username,
        tutorDisplayName: tutorNotifyProfile.display_name,
        slots: toInsert.map((slot) => ({
          startsAt: slot.startsAt.toISOString(),
          endsAt: slot.endsAt.toISOString(),
        })),
      });
    }
  } catch (err) {
    console.error("[createAvailabilitySlot] Failed to send availability alerts:", err);
  }

  const skipped = hourlyWindows.length - toInsert.length;
  return {
    ok: true as const,
    created: toInsert.length,
    skipped,
    message:
      skipped > 0
        ? `Added ${toInsert.length} hour slot(s). ${skipped} overlapped existing times.`
        : `Added ${toInsert.length} one-hour bookable slot(s).`,
  };
}

export async function cancelBooking(bookingId: string) {
  const { profile } = await requireTutorProfile();
  const result = await cancelLessonBooking({
    bookingId,
    tutorId: profile.id,
    cancelledBy: "tutor",
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  await revalidateTutor(profile.username);
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function notifyRunningLate(bookingId: string, note?: string) {
  const { profile } = await requireTutorProfile();
  const result = await sendRunningLateNotice({
    bookingId,
    tutorId: profile.id,
    note,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/dashboard");
  return {
    ok: true as const,
    emailed: false,
    message: "Running late notice sent to parent workspace and chat thread.",
  };
}

export async function sendLessonReminderAction(bookingId: string) {
  const { profile } = await requireTutorProfile();
  const result = await sendLessonReminder(bookingId, profile.id);

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function deleteAvailabilitySlot(slotId: string) {
  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;
  if (testVal === "dashboard") {
    return { ok: true as const };
  }

  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { data: slot, error: fetchError } = await supabase
    .from("availability_slots")
    .select("id, is_booked")
    .eq("id", slotId)
    .eq("tutor_id", profile.id)
    .maybeSingle();

  if (fetchError || !slot) {
    return { ok: false as const, error: "Slot not found." };
  }

  if (slot.is_booked) {
    return { ok: false as const, error: "Cannot delete a booked slot." };
  }

  const { error } = await supabase
    .from("availability_slots")
    .delete()
    .eq("id", slotId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await revalidateTutor(profile.username);
  return { ok: true as const };
}

export async function uploadDigitalResource(formData: FormData) {
  const { profile } = await requireTutorProfile();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const file = formData.get("file");

  if (!title) {
    return { ok: false as const, error: "Title is required." };
  }

  const priceCents = parsePriceToCents(priceRaw);
  if (priceCents === null) {
    return { ok: false as const, error: "Enter a valid price (e.g. 4.99)." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Choose a PDF or DOCX file." };
  }

  if (file.size > MAX_FILE_BYTES) {
    return { ok: false as const, error: "File must be 50 MB or smaller." };
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false as const, error: "Only PDF and DOCX files are allowed." };
  }

  const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
  const storagePath = `${profile.id}/${crypto.randomUUID()}-${safeName}`;

  const supabase = await createClient();
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await uploadTutorFile({
    tutorId: profile.id,
    bucket: WORKSHEET_BUCKET,
    path: storagePath,
    bytes,
    contentType: file.type,
  });

  if (uploadError) {
    return { ok: false as const, error: formatSupabaseError(uploadError.message) };
  }

  const { error: insertError } = await supabase.from("digital_resources").insert({
    tutor_id: profile.id,
    title,
    description: description || null,
    price_cents: priceCents,
    currency: profile.currency,
    file_path: storagePath,
    is_published: true,
  });

  if (insertError) {
    await removeTutorFiles(profile.id, WORKSHEET_BUCKET, [storagePath]);
    return { ok: false as const, error: formatSupabaseError(insertError.message) };
  }

  await revalidateTutor(profile.username);
  return { ok: true as const };
}

export async function deleteDigitalResource(resourceId: string) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { data: resource, error: fetchError } = await supabase
    .from("digital_resources")
    .select("id, file_path")
    .eq("id", resourceId)
    .eq("tutor_id", profile.id)
    .maybeSingle();

  if (fetchError || !resource) {
    return { ok: false as const, error: "Resource not found." };
  }

  await removeTutorFiles(profile.id, WORKSHEET_BUCKET, [resource.file_path]);

  const { error } = await supabase
    .from("digital_resources")
    .delete()
    .eq("id", resourceId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await revalidateTutor(profile.username);
  return { ok: true as const };
}

export async function toggleDigitalResourcePublished(
  resourceId: string,
  isPublished: boolean,
) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("digital_resources")
    .update({ is_published: isPublished })
    .eq("id", resourceId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await revalidateTutor(profile.username);
  return { ok: true as const };
}

export async function addStudent(input: {
  studentName: string;
  parentEmail: string;
  notes?: string;
}) {
  const { profile } = await requireTutorProfile();

  const studentName = input.studentName.trim();
  const parentEmail = input.parentEmail.trim().toLowerCase();

  if (!studentName || !parentEmail) {
    return { ok: false as const, error: "Student name and parent email are required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(parentEmail)) {
    return { ok: false as const, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("students").insert({
    tutor_id: profile.id,
    student_name: studentName,
    parent_email: parentEmail,
    notes: input.notes?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: "This student is already in your ledger." };
    }
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  try {
    const { sendStudentInvitationEmail } = await import("@/lib/notifications/auth-email");
    const { PUBLIC_SITE_URL } = await import("@/lib/constants");
    
    let workspaceUrl = `${PUBLIC_SITE_URL}/tutor/${profile.username}/workspace`;
    let isNewUser = false;

    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();
      const { data: usersData } = await admin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === parentEmail
      );

      if (!existingUser) {
        isNewUser = true;
        workspaceUrl = `${PUBLIC_SITE_URL}/auth/signup?role=parent&email=${encodeURIComponent(parentEmail)}&next=${encodeURIComponent(
          `/tutor/${profile.username}/workspace`
        )}`;
      }
    } catch (err) {
      console.error("Failed to pre-create student auth account:", err);
    }

    await sendStudentInvitationEmail({
      to: parentEmail,
      tutorName: profile.displayName,
      studentName: studentName,
      workspaceUrl,
      isNewUser,
    });
  } catch (err) {
    console.error("Failed to send student invitation email:", err);
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function updateStudentStatus(
  studentId: string,
  status: "active" | "archived",
) {
  const { profile } = await requireTutorProfile();
  const { getSchemaFeatures } = await import("@/lib/supabase/schema-features");
  const features = await getSchemaFeatures();
  if (!features.studentStatus) {
    return {
      ok: false as const,
      error:
        "Student archive is not available until database migration 008 is applied (Supabase GitHub sync or SQL Editor).",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .update({
      status,
      archived_at: status === "archived" ? new Date().toISOString() : null,
    })
    .eq("id", studentId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function saveLessonFeedback(input: {
  bookingId: string;
  feedback?: string;
  lessonRating?: number | null;
}) {
  const { profile } = await requireTutorProfile();
  const { getSchemaFeatures } = await import("@/lib/supabase/schema-features");
  const features = await getSchemaFeatures();
  if (!features.lessonFeedback) {
    return {
      ok: false as const,
      error:
        "Lesson feedback is not available until database migration 008 is applied.",
    };
  }

  const supabase = await createClient();

  const feedback = input.feedback?.trim() || null;
  const lessonRating =
    input.lessonRating != null &&
    input.lessonRating >= 1 &&
    input.lessonRating <= 5
      ? input.lessonRating
      : null;

  const { error } = await supabase
    .from("bookings")
    .update({
      tutor_lesson_feedback: feedback,
      lesson_rating: lessonRating,
    })
    .eq("id", input.bookingId)
    .eq("tutor_id", profile.id)
    .eq("status", "confirmed");

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function updateStudentNotes(studentId: string, notes: string) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .update({ notes: notes.trim() || null })
    .eq("id", studentId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function updateStudentCredits(studentId: string, credits: number) {
  const { profile } = await requireTutorProfile();
  
  // Use admin client so tutors can override student table parameters safely
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: student } = await admin
    .from("students")
    .select("credit_limit")
    .eq("id", studentId)
    .eq("tutor_id", profile.id)
    .maybeSingle();

  const limit = student?.credit_limit ?? 0;
  if (credits < -limit) {
    return { ok: false as const, error: `Credits cannot go below the allowed credit limit of -${limit}.` };
  }

  const { error } = await admin
    .from("students")
    .update({ lesson_credits: credits })
    .eq("id", studentId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard/students");
  return { ok: true as const };
}

export async function updateStudentCreditLimit(studentId: string, limit: number) {
  const { profile } = await requireTutorProfile();
  
  if (limit < 0) {
    return { ok: false as const, error: "Credit limit must be 0 or positive." };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { error } = await admin
    .from("students")
    .update({ credit_limit: limit })
    .eq("id", studentId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard/students");
  return { ok: true as const };
}

export async function deleteStudent(studentId: string) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function bookSlotManually(input: {
  slotId: string;
  parentEmail: string;
  studentName?: string;
}) {
  const { profile } = await requireTutorProfile();
  
  // Use createAdminClient to bypass RLS policies so tutors can insert manual bookings safely!
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  // 1. Fetch the slot and check if it's booked and belongs to the tutor
  const { data: slot, error: fetchError } = await supabase
    .from("availability_slots")
    .select("id, is_booked")
    .eq("id", input.slotId)
    .eq("tutor_id", profile.id)
    .maybeSingle();

  if (fetchError || !slot) {
    return { ok: false as const, error: "Slot not found." };
  }

  if (slot.is_booked) {
    return { ok: false as const, error: "Slot is already booked." };
  }

  // 2. Mark slot as booked
  const { error: updateError } = await supabase
    .from("availability_slots")
    .update({ is_booked: true })
    .eq("id", input.slotId)
    .eq("tutor_id", profile.id);

  if (updateError) {
    return { ok: false as const, error: "Failed to update slot status." };
  }

  // 3. Create the booking record
  const studentName = input.studentName?.trim() || "Manual Booking";
  const parentEmail = input.parentEmail.trim().toLowerCase();

  const { data: bookingRow, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      slot_id: input.slotId,
      tutor_id: profile.id,
      parent_email: parentEmail,
      student_name: studentName,
      amount_cents: 0, // Manual/offline payment
      platform_fee_cents: 0,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (bookingError || !bookingRow) {
    // Revert the slot is_booked update
    await supabase
      .from("availability_slots")
      .update({ is_booked: false })
      .eq("id", input.slotId)
      .eq("tutor_id", profile.id);

    return { ok: false as const, error: "Failed to create booking." };
  }

  // 4. Create student record if it doesn't exist
  await supabase.from("students").upsert(
    {
      tutor_id: profile.id,
      student_name: studentName,
      parent_email: parentEmail,
      status: "active",
    },
    { onConflict: "tutor_id,parent_email,student_name" }
  );

  // 5. Try syncing to Google calendar
  try {
    const { syncBookingToGoogleCalendar } = await import("@/lib/calendar/sync-booking");
    await syncBookingToGoogleCalendar(bookingRow.id);
  } catch (err) {
    console.error("Google Calendar manual sync failed:", err);
  }

  await revalidateTutor(profile.username);
  return { ok: true as const };
}

export async function assignStudentTask(input: {
  studentId: string;
  title: string;
  description?: string;
}) {
  const { profile } = await requireTutorProfile();
  const title = input.title.trim();
  const description = input.description?.trim() || null;

  if (!title) {
    return { ok: false as const, error: "Task title is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("student_tasks").insert({
    student_id: input.studentId,
    tutor_id: profile.id,
    title,
    description,
    status: "pending",
  });

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function deleteStudentTask(taskId: string) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("student_tasks")
    .delete()
    .eq("id", taskId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function toggleTaskStatus(taskId: string, status: "pending" | "completed") {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Unauthorized." };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: task } = await admin
    .from("student_tasks")
    .select("tutor_id, student_id")
    .eq("id", taskId)
    .maybeSingle();

  if (!task) {
    return { ok: false as const, error: "Task not found." };
  }

  let authorized = false;

  if (task.tutor_id === user.id) {
    authorized = true;
  } else {
    const { data: student } = await admin
      .from("students")
      .select("parent_email")
      .eq("id", task.student_id)
      .maybeSingle();

    if (student && student.parent_email.toLowerCase() === user.email?.toLowerCase()) {
      authorized = true;
    }
  }

  if (!authorized) {
    return { ok: false as const, error: "Unauthorized to update this task." };
  }

  const completedAt = status === "completed" ? new Date().toISOString() : null;

  const { error } = await admin
    .from("student_tasks")
    .update({
      status,
      completed_at: completedAt,
    })
    .eq("id", taskId);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function saveTaskFeedback(taskId: string, feedback: string) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("student_tasks")
    .update({ tutor_feedback: feedback.trim() || null })
    .eq("id", taskId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function resendStudentInvitation(studentId: string) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { data: student, error: fetchError } = await supabase
    .from("students")
    .select("student_name, parent_email")
    .eq("id", studentId)
    .eq("tutor_id", profile.id)
    .maybeSingle();

  if (fetchError || !student) {
    return { ok: false as const, error: "Student not found." };
  }

  const parentEmail = student.parent_email.trim().toLowerCase();

  try {
    const { sendStudentInvitationEmail } = await import("@/lib/notifications/auth-email");
    const { PUBLIC_SITE_URL } = await import("@/lib/constants");
    
    let workspaceUrl = `${PUBLIC_SITE_URL}/tutor/${profile.username}/workspace`;
    let isNewUser = false;

    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();
      const { data: usersData } = await admin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === parentEmail
      );

      if (!existingUser) {
        isNewUser = true;
        workspaceUrl = `${PUBLIC_SITE_URL}/auth/signup?role=parent&email=${encodeURIComponent(parentEmail)}&next=${encodeURIComponent(
          `/tutor/${profile.username}/workspace`
        )}`;
      }
    } catch (err) {
      console.error("Failed to pre-create student auth account on resend:", err);
    }

    await sendStudentInvitationEmail({
      to: parentEmail,
      tutorName: profile.displayName,
      studentName: student.student_name,
      workspaceUrl,
      isNewUser,
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Failed to send invitation email." };
  }
}

export async function updateStudentDetails(
  studentId: string,
  studentName: string,
  parentEmail: string,
) {
  const { profile } = await requireTutorProfile();

  const name = studentName.trim();
  const email = parentEmail.trim().toLowerCase();

  if (!name || !email) {
    return { ok: false as const, error: "Student name and parent email are required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { ok: false as const, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      student_name: name,
      parent_email: email,
    })
    .eq("id", studentId)
    .eq("tutor_id", profile.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: "A student with this email is already registered." };
    }
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function confirmBooking(bookingId: string) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, parent_email, student_name, amount_cents, currency, availability_slots (starts_at, ends_at)")
      .eq("id", bookingId)
      .single();

    if (booking) {
      const slot = Array.isArray(booking.availability_slots)
        ? booking.availability_slots[0]
        : booking.availability_slots;
      
      const startsAt = (slot as any)?.starts_at;
      const endsAt = (slot as any)?.ends_at;

      const { sendBookingConfirmationEmail } = await import(
        "@/lib/notifications/booking-confirmation"
      );
      await sendBookingConfirmationEmail({
        bookingId: booking.id,
        to: booking.parent_email,
        tutorName: profile.displayName,
        tutorUsername: profile.username,
        studentName: booking.student_name,
        startsAt,
        endsAt,
        amountCents: booking.amount_cents,
        currency: booking.currency,
        isApprovedNotice: true,
      });
    }
  } catch (err) {
    console.error("Failed to send booking approval email:", err);
  }

  // Revalidate paths so UI updates instantly
  await revalidateTutor(profile.username);
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function toggleBookingPaidStatus(bookingId: string, isPaid: boolean) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({ is_paid: isPaid })
    .eq("id", bookingId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await revalidateTutor(profile.username);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/students");
  return { ok: true as const };
}

export async function sendManualPaymentReminder(studentId: string) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("student_name, parent_email")
    .eq("id", studentId)
    .eq("tutor_id", profile.id)
    .maybeSingle();

  if (studentError || !student) {
    return { ok: false as const, error: "Student not found." };
  }

  let selectQuery = `
    id,
    amount_cents,
    is_paid,
    stripe_payment_intent_id
  `;

  let res = await supabase
    .from("bookings")
    .select(selectQuery)
    .eq("tutor_id", profile.id)
    .eq("parent_email", student.parent_email)
    .eq("status", "confirmed")
    .eq("is_paid", false)
    .eq("stripe_payment_intent_id", "cash");

  if (res.error && (res.error.code === "42703" || res.error.message.includes("is_paid"))) {
    return { ok: false as const, error: "No unpaid cash bookings found." };
  }

  const bookings = res.data as any[];
  if (res.error || !bookings || bookings.length === 0) {
    return { ok: false as const, error: "No unpaid cash bookings found." };
  }

  const totalOwedCents = bookings.reduce((sum, b) => sum + b.amount_cents, 0);

  const messageContent = `🔔 [Payment Reminder] Hello, this is a friendly reminder that you have an outstanding balance of ${formatMoney(totalOwedCents, profile.currency)} for our lessons. Please view payment instructions and settle at your convenience. Thank you!`;

  const { error: msgErr } = await supabase.from("messages").insert({
    tutor_id: profile.id,
    parent_email: student.parent_email,
    sender: "tutor",
    content: messageContent,
  });

  if (msgErr) {
    return { ok: false as const, error: "Failed to send chat reminder message." };
  }

  const bookingIds = bookings.map((b) => b.id);
  const updatePayload: any = { payment_reminder_sent_at: new Date().toISOString() };
  
  const { error: updateErr } = await supabase
    .from("bookings")
    .update(updatePayload)
    .in("id", bookingIds);

  if (updateErr && (updateErr.code === "42703" || updateErr.message.includes("payment_reminder_sent_at"))) {
    // Ignore if column doesn't exist
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/students");
  return { ok: true as const };
}

export async function insertDigitalResourceRecord(input: {
  title: string;
  description: string;
  priceRaw: string;
  filePath: string;
}) {
  const { profile } = await requireTutorProfile();

  const title = input.title.trim();
  const description = input.description.trim();
  const priceCents = parsePriceToCents(input.priceRaw);

  if (!title) {
    return { ok: false as const, error: "Title is required." };
  }

  if (priceCents === null) {
    return { ok: false as const, error: "Enter a valid price (e.g. 4.99)." };
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("digital_resources").insert({
    tutor_id: profile.id,
    title,
    description: description || null,
    price_cents: priceCents,
    currency: profile.currency,
    file_path: input.filePath,
    is_published: true,
  });

  if (insertError) {
    return { ok: false as const, error: formatSupabaseError(insertError.message) };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/tutor/${profile.username}`);
  return { ok: true as const };
}

export async function savePushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const { requireUser } = await import("@/lib/auth/session");
  const user = await requireUser();

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  return { ok: true as const };
}

export async function deletePushSubscription(endpoint: string) {
  const { requireUser } = await import("@/lib/auth/session");
  const user = await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  return { ok: true as const };
}

export async function getScheduleRules() {
  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;
  if (testVal === "dashboard") {
    return {
      ok: true as const,
      rules: [
        {
          id: "rule-mock-1",
          day_of_week: 1,
          start_time: "14:00:00",
          end_time: "17:00:00",
          is_active: true,
        },
      ],
    };
  }

  const { profile } = await requireTutorProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedule_rules")
    .select("*")
    .eq("tutor_id", profile.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }
  return { ok: true as const, rules: data ?? [] };
}

export async function createScheduleRule(input: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  if (input.endTime <= input.startTime) {
    return { ok: false as const, error: "End time must be after start time." };
  }

  const { data, error } = await supabase
    .from("schedule_rules")
    .insert({
      tutor_id: profile.id,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime + ":00",
      end_time: input.endTime + ":00",
      is_active: true
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: "You already have a recurring rule for this day and time range." };
    }
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  return { ok: true as const, rule: data };
}

export async function deleteScheduleRule(ruleId: string) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("schedule_rules")
    .delete()
    .eq("id", ruleId)
    .eq("tutor_id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  return { ok: true as const };
}

export async function generateSlotsFromRulesAction(weeksAhead = 4) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { data: rules, error: rulesError } = await supabase
    .from("schedule_rules")
    .select("*")
    .eq("tutor_id", profile.id)
    .eq("is_active", true);

  if (rulesError) {
    return { ok: false as const, error: formatSupabaseError(rulesError.message) };
  }

  if (!rules || rules.length === 0) {
    return { ok: false as const, error: "No recurring schedule rules found. Add some rules first." };
  }

  const { data: existingSlots } = await supabase
    .from("availability_slots")
    .select("starts_at, ends_at")
    .eq("tutor_id", profile.id)
    .gte("ends_at", new Date().toISOString());

  const now = new Date();
  const toInsert: { tutor_id: string; starts_at: string; ends_at: string }[] = [];
  let totalGenerated = 0;
  let totalSkipped = 0;

  for (const rule of rules) {
    for (let d = 0; d < weeksAhead * 7; d++) {
      const currentDay = new Date(now);
      currentDay.setDate(now.getDate() + d);
      if (currentDay.getDay() === rule.day_of_week) {
        const [startH, startM] = rule.start_time.split(":");
        const [endH, endM] = rule.end_time.split(":");

        const startsAt = new Date(currentDay);
        startsAt.setHours(parseInt(startH, 10), parseInt(startM, 10), 0, 0);

        const endsAt = new Date(currentDay);
        endsAt.setHours(parseInt(endH, 10), parseInt(endM, 10), 0, 0);

        if (startsAt > now) {
          const hourlyWindows = splitAvailabilityIntoHourlySlots(startsAt, endsAt);
          
          for (const window of hourlyWindows) {
            const hasClash = (existingSlots ?? []).some((row) =>
              rangesOverlap(
                window.startsAt,
                window.endsAt,
                new Date(row.starts_at),
                new Date(row.ends_at),
              )
            );

            if (hasClash) {
              totalSkipped += 1;
            } else {
              toInsert.push({
                tutor_id: profile.id,
                starts_at: window.startsAt.toISOString(),
                ends_at: window.endsAt.toISOString(),
              });
              totalGenerated += 1;
            }
          }
        }
      }
    }
  }

  if (toInsert.length === 0) {
    return {
      ok: false as const,
      error: `All of the recurring slots already exist on your calendar for the next ${weeksAhead} weeks.`,
    };
  }

  const { error: insertError } = await supabase
    .from("availability_slots")
    .insert(toInsert);

  if (insertError) {
    return { ok: false as const, error: formatSupabaseError(insertError.message) };
  }

  await revalidateTutor(profile.username);
  revalidatePath("/dashboard/schedule");

  return {
    ok: true as const,
    generated: totalGenerated,
    skipped: totalSkipped,
    message: `Successfully generated ${totalGenerated} slots for the next ${weeksAhead} weeks (${totalSkipped} skipped as duplicates).`,
  };
}

export async function approveStudentApplication(studentId: string) {
  const { profile } = await requireTutorProfile();
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: student, error: fetchError } = await admin
    .from("students")
    .select("student_name, parent_email")
    .eq("id", studentId)
    .eq("tutor_id", profile.id)
    .eq("status", "pending")
    .maybeSingle();

  if (fetchError || !student) {
    return { ok: false as const, error: "Application not found." };
  }

  const { error: updateError } = await admin
    .from("students")
    .update({ status: "active" })
    .eq("id", studentId);

  if (updateError) {
    return { ok: false as const, error: formatSupabaseError(updateError.message) };
  }

  // Send the invitation email
  try {
    const parentEmail = student.parent_email.trim().toLowerCase();
    const { sendStudentInvitationEmail } = await import("@/lib/notifications/auth-email");
    const { PUBLIC_SITE_URL } = await import("@/lib/constants");

    let workspaceUrl = `${PUBLIC_SITE_URL}/auth/signup?role=parent&email=${encodeURIComponent(parentEmail)}&next=${encodeURIComponent(`/tutor/${profile.username}/workspace`)}`;
    let isNewUser = true;

    try {
      const { data: usersData } = await admin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === parentEmail
      );
      if (existingUser) {
        isNewUser = false;
        workspaceUrl = `${PUBLIC_SITE_URL}/tutor/${profile.username}/workspace`;
      }
    } catch (err) {
      console.error("Failed to check if user exists on approval:", err);
    }

    await sendStudentInvitationEmail({
      to: parentEmail,
      tutorName: profile.displayName,
      studentName: student.student_name,
      workspaceUrl,
      isNewUser,
    });
  } catch (err) {
    console.error("Failed to send student invitation email on approval:", err);
  }

  revalidatePath("/dashboard/students");
  await revalidateTutor(profile.username);
  return { ok: true as const };
}

export async function rejectStudentApplication(studentId: string) {
  const { profile } = await requireTutorProfile();
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { error } = await admin
    .from("students")
    .delete()
    .eq("id", studentId)
    .eq("tutor_id", profile.id)
    .eq("status", "pending");

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard/students");
  await revalidateTutor(profile.username);
  return { ok: true as const };
}

export async function cancelBookingByStudent(bookingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { ok: false as const, error: "Unauthorized. Please sign in." };
  }

  const email = user.email.toLowerCase();
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: booking, error: fetchError } = await admin
    .from("bookings")
    .select("id, status, tutor_id, parent_email")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError || !booking) {
    return { ok: false as const, error: "Booking not found." };
  }

  if (booking.parent_email.toLowerCase() !== email) {
    return { ok: false as const, error: "You do not have permission to cancel this booking." };
  }

  const result = await cancelLessonBooking({
    bookingId: booking.id,
    tutorId: booking.tutor_id,
    cancelledBy: "parent",
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  const { data: tutor } = await admin
    .from("tutor_profiles")
    .select("username")
    .eq("id", booking.tutor_id)
    .maybeSingle();

  if (tutor) {
    await revalidateTutor(tutor.username);
    revalidatePath(`/tutor/${tutor.username}/workspace`);
  }

  return { ok: true as const };
}

export async function saveGeneratedSlotsAction(
  candidateSlots: { startsAt: string; endsAt: string }[],
  weeksAhead: number
) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { data: existingSlots } = await supabase
    .from("availability_slots")
    .select("starts_at, ends_at")
    .eq("tutor_id", profile.id)
    .gte("ends_at", new Date().toISOString());

  const toInsert: { tutor_id: string; starts_at: string; ends_at: string }[] = [];
  let totalGenerated = 0;
  let totalSkipped = 0;

  for (const slot of candidateSlots) {
    const slotStart = new Date(slot.startsAt);
    const slotEnd = new Date(slot.endsAt);

    const hasClash = (existingSlots ?? []).some((row) =>
      rangesOverlap(
        slotStart,
        slotEnd,
        new Date(row.starts_at),
        new Date(row.ends_at),
      )
    );

    if (hasClash) {
      totalSkipped += 1;
    } else {
      toInsert.push({
        tutor_id: profile.id,
        starts_at: slot.startsAt,
        ends_at: slot.endsAt,
      });
      totalGenerated += 1;
    }
  }

  if (toInsert.length === 0) {
    return {
      ok: false as const,
      error: `All of the recurring slots already exist on your calendar for the next ${weeksAhead} weeks.`,
    };
  }

  const { error: insertError } = await supabase
    .from("availability_slots")
    .insert(toInsert);

  if (insertError) {
    return { ok: false as const, error: formatSupabaseError(insertError.message) };
  }

  await revalidateTutor(profile.username);
  revalidatePath("/dashboard/schedule");

  return {
    ok: true as const,
    message: `Successfully generated ${totalGenerated} slots (skipped ${totalSkipped} existing).`,
  };
}

export async function moveAvailabilitySlotAction(input: {
  slotId: string;
  startsAtIso: string;
  endsAtIso: string;
}) {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  // 1. Verify slot ownership
  const { data: slot, error: fetchError } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("id", input.slotId)
    .eq("tutor_id", profile.id)
    .single();

  if (fetchError || !slot) {
    return { ok: false as const, error: "Slot not found or access denied." };
  }

  let bookingToNotify = null;
  if (slot.is_booked) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("slot_id", input.slotId)
      .eq("status", "confirmed")
      .maybeSingle();
    if (booking) {
      bookingToNotify = booking;
    }
  }

  // 2. Check for overlaps/clashes with OTHER slots
  const { data: existingSlots } = await supabase
    .from("availability_slots")
    .select("id, starts_at, ends_at")
    .eq("tutor_id", profile.id)
    .neq("id", input.slotId);

  const newStart = new Date(input.startsAtIso);
  const newEnd = new Date(input.endsAtIso);

  const hasClash = (existingSlots ?? []).some((row) =>
    rangesOverlap(
      newStart,
      newEnd,
      new Date(row.starts_at),
      new Date(row.ends_at),
    )
  );

  if (hasClash) {
    return { ok: false as const, error: "This time slot overlaps with another scheduled slot." };
  }

  // 3. Update the slot
  const { error: updateError } = await supabase
    .from("availability_slots")
    .update({
      starts_at: input.startsAtIso,
      ends_at: input.endsAtIso,
    })
    .eq("id", input.slotId);

  if (updateError) {
    return { ok: false as const, error: formatSupabaseError(updateError.message) };
  }

  if (bookingToNotify) {
    try {
      const oldSlotLabel = formatSlotRange(slot.starts_at, slot.ends_at);
      const newSlotLabel = formatSlotRange(input.startsAtIso, input.endsAtIso);
      const { sendBookingMovedEmail } = await import("@/lib/notifications/booking-update");
      await sendBookingMovedEmail({
        to: bookingToNotify.parent_email,
        tutorName: profile.displayName,
        studentName: bookingToNotify.student_name,
        oldSlotLabel,
        newSlotLabel,
      });
    } catch (err) {
      console.error("Failed to send booking rescheduled email notification:", err);
    }
  }

  await revalidateTutor(profile.username);
  revalidatePath("/dashboard/schedule");

  return { ok: true as const };
}


