"use server";

import { revalidatePath } from "next/cache";

import { cancelLessonBooking } from "@/lib/bookings/cancel-booking";
import { sendRunningLateNotice } from "@/lib/bookings/running-late";
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
  date: string;
  startTime: string;
  endTime: string;
}) {
  const { profile } = await requireTutorProfile();
  const startsAt = new Date(`${input.date}T${input.startTime}`);
  const endsAt = new Date(`${input.date}T${input.endTime}`);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { ok: false as const, error: "Invalid date or time." };
  }

  if (endsAt <= startsAt) {
    return { ok: false as const, error: "End time must be after start time." };
  }

  if (startsAt <= new Date()) {
    return { ok: false as const, error: "Availability must be in the future." };
  }

  const hourlyWindows = splitAvailabilityIntoHourlySlots(startsAt, endsAt);
  if (hourlyWindows.length === 0) {
    const hours = (endsAt.getTime() - startsAt.getTime()) / (60 * 60 * 1000);
    if (hours > MAX_AVAILABILITY_BLOCK_HOURS) {
      return {
        ok: false as const,
        error: `Maximum block is ${MAX_AVAILABILITY_BLOCK_HOURS} hours per add.`,
      };
    }
    return {
      ok: false as const,
      error: `Use whole-hour blocks (e.g. 2:00pm–5:00pm creates three 1-hour bookable slots). Each slot is ${LESSON_SLOT_DURATION_MINUTES} minutes.`,
    };
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
    emailed: result.emailed,
    message: result.emailed
      ? "Running late email sent to the parent."
      : "Saved on the booking. Add RESEND_API_KEY to email parents automatically.",
  };
}

export async function deleteAvailabilitySlot(slotId: string) {
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
    const workspaceUrl = `${PUBLIC_SITE_URL}/tutor/${profile.username}/workspace`;
    await sendStudentInvitationEmail({
      to: parentEmail,
      tutorName: profile.displayName,
      studentName: studentName,
      workspaceUrl,
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
  
  let authorized = false;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Unauthorized." };
  }

  const { data: task } = await supabase
    .from("student_tasks")
    .select("tutor_id, student_id")
    .eq("id", taskId)
    .maybeSingle();

  if (!task) {
    return { ok: false as const, error: "Task not found." };
  }

  if (task.tutor_id === user.id) {
    authorized = true;
  } else {
    const { data: student } = await supabase
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

  const { error } = await supabase
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

  try {
    const { sendStudentInvitationEmail } = await import("@/lib/notifications/auth-email");
    const { PUBLIC_SITE_URL } = await import("@/lib/constants");
    const workspaceUrl = `${PUBLIC_SITE_URL}/tutor/${profile.username}/workspace`;
    
    await sendStudentInvitationEmail({
      to: student.parent_email,
      tutorName: profile.displayName,
      studentName: student.student_name,
      workspaceUrl,
    });
    return { ok: true as const };
  } catch (err) {
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
