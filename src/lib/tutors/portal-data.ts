import { createClient } from "@/lib/supabase/server";
import type { AvailabilitySlotRow, DigitalResourceRow } from "@/lib/supabase/database.types";
import type { DigitalResource, OpenSlot, TutorSlot } from "@/lib/types";

export async function getOpenSlotsForTutor(tutorId: string): Promise<OpenSlot[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("tutor_id", tutorId)
    .eq("is_booked", false)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true });

  if (error || !data) return [];

  return (data as AvailabilitySlotRow[]).map((row) => ({
    id: row.id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    available: !row.is_booked,
  }));
}

export async function getPublishedResourcesForTutor(
  tutorId: string,
): Promise<DigitalResource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("digital_resources")
    .select("*")
    .eq("tutor_id", tutorId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as DigitalResourceRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    priceCents: row.price_cents,
    currency: row.currency,
    thumbnailUrl: row.thumbnail_url ?? undefined,
  }));
}

export async function getResourcesForTutorOwner(
  tutorId: string,
): Promise<DigitalResource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("digital_resources")
    .select("*")
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as DigitalResourceRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    priceCents: row.price_cents,
    currency: row.currency,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    isPublished: row.is_published,
  }));
}

export async function getSlotsForTutorOwner(tutorId: string): Promise<TutorSlot[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("tutor_id", tutorId)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true });

  if (error || !data) return [];

  return (data as AvailabilitySlotRow[]).map((row) => ({
    id: row.id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isBooked: row.is_booked,
  }));
}

export async function getStudentsForTutor(tutorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
