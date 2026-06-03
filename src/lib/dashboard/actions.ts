"use server";

import { revalidatePath } from "next/cache";

import { requireTutorProfile } from "@/lib/auth/session";
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
  const normalized = raw.replace(/[£,\s]/g, "");
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
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
    return { ok: false as const, error: "Slot must be in the future." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("availability_slots").insert({
    tutor_id: profile.id,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  });

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await revalidateTutor(profile.username);
  return { ok: true as const };
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
