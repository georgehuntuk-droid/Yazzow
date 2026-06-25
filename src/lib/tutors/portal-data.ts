import { createClient } from "@/lib/supabase/server";
import type {
  AvailabilitySlotRow,
  BookingRow,
  DigitalResourceRow,
} from "@/lib/supabase/database.types";
import { LESSON_SLOT_DURATION_MINUTES } from "@/lib/constants";
import type { DigitalResource, OpenSlot, RecentBooking, TutorSlot } from "@/lib/types";

const LESSON_SLOT_MS = LESSON_SLOT_DURATION_MINUTES * 60 * 1000;

function isHourlySlot(startsAt: string, endsAt: string): boolean {
  return new Date(endsAt).getTime() - new Date(startsAt).getTime() === LESSON_SLOT_MS;
}

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

  return (data as AvailabilitySlotRow[])
    .filter((row) => isHourlySlot(row.starts_at, row.ends_at))
    .map((row) => ({
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
  // Fetch slots from 24 hours ago so today's slots remain visible to the tutor
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  const queryStart = twentyFourHoursAgo.toISOString();

  const { data, error } = await supabase
    .from("availability_slots")
    .select(`
      id,
      starts_at,
      ends_at,
      is_booked,
      bookings (
        id,
        parent_email,
        student_name,
        status,
        running_late_sent_at,
        running_late_note,
        student_running_late_sent_at,
        student_running_late_note,
        lesson_reminder_sent_at
      )
    `)
    .eq("tutor_id", tutorId)
    .gte("starts_at", queryStart)
    .order("starts_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row: any) => {
    const rawBooking = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings;
    const booking = rawBooking && (rawBooking.status === "confirmed" || rawBooking.status === "pending") ? {
      id: rawBooking.id,
      parentEmail: rawBooking.parent_email,
      studentName: rawBooking.student_name,
      status: rawBooking.status,
      runningLateSentAt: rawBooking.running_late_sent_at,
      runningLateNote: rawBooking.running_late_note,
      studentRunningLateSentAt: rawBooking.student_running_late_sent_at,
      studentRunningLateNote: rawBooking.student_running_late_note,
      lessonReminderSentAt: rawBooking.lesson_reminder_sent_at,
    } : null;

    return {
      id: row.id,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isBooked: row.is_booked,
      booking,
    };
  });
}

export async function getRecentBookingsForTutor(
  tutorId: string,
  limit = 10,
): Promise<RecentBooking[]> {
  const supabase = await createClient();
  let selectQuery = `
    id,
    slot_id,
    parent_email,
    student_name,
    amount_cents,
    status,
    running_late_sent_at,
    running_late_note,
    student_running_late_sent_at,
    student_running_late_note,
    lesson_reminder_sent_at,
    created_at,
    is_paid,
    stripe_payment_intent_id,
    availability_slots (starts_at, ends_at)
  `;

  let res = await supabase
    .from("bookings")
    .select(selectQuery)
    .eq("tutor_id", tutorId)
    .in("status", ["confirmed", "pending"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (res.error && (res.error.code === "42703" || res.error.message.includes("is_paid"))) {
    selectQuery = `
      id,
      slot_id,
      parent_email,
      student_name,
      amount_cents,
      status,
      running_late_sent_at,
      running_late_note,
      student_running_late_sent_at,
      student_running_late_note,
      lesson_reminder_sent_at,
      created_at,
      stripe_payment_intent_id,
      availability_slots (starts_at, ends_at)
    `;
    res = await supabase
      .from("bookings")
      .select(selectQuery)
      .eq("tutor_id", tutorId)
      .in("status", ["confirmed", "pending"])
      .order("created_at", { ascending: false })
      .limit(limit);
  }

  const data = res.data;
  if (res.error || !data) return [];

  return data.map((row) => {
    const booking = (row as unknown) as BookingRow & {
      slot_id: string;
      availability_slots:
        | Pick<AvailabilitySlotRow, "starts_at" | "ends_at">
        | Pick<AvailabilitySlotRow, "starts_at" | "ends_at">[]
        | null;
    };
    const slot = Array.isArray(booking.availability_slots)
      ? booking.availability_slots[0]
      : booking.availability_slots;
    
    const isPaid = (booking as any).is_paid !== undefined 
      ? (booking as any).is_paid 
      : (booking.stripe_payment_intent_id !== "cash");

    return {
      id: booking.id,
      slotId: booking.slot_id,
      parentEmail: booking.parent_email,
      studentName: booking.student_name,
      amountCents: booking.amount_cents,
      status: booking.status,
      runningLateSentAt: booking.running_late_sent_at ?? null,
      runningLateNote: booking.running_late_note ?? null,
      studentRunningLateSentAt: (booking as any).student_running_late_sent_at ?? null,
      studentRunningLateNote: (booking as any).student_running_late_note ?? null,
      lessonReminderSentAt: (booking as any).lesson_reminder_sent_at ?? null,
      createdAt: booking.created_at,
      startsAt: slot?.starts_at ?? booking.created_at,
      endsAt: slot?.ends_at ?? booking.created_at,
      isPaid,
      stripePaymentIntentId: booking.stripe_payment_intent_id ?? null,
    };
  });
}

export type DigitalPackSale = {
  id: string;
  resourceTitle: string;
  buyerEmail: string;
  amountCents: number;
  platformFeeCents: number;
  tutorNetCents: number;
  createdAt: string;
};

export async function getDigitalSalesForTutor(
  tutorId: string,
  limit = 25,
): Promise<DigitalPackSale[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_purchases")
    .select(
      `
      id,
      buyer_email,
      amount_cents,
      platform_fee_cents,
      created_at,
      digital_resources (title)
    `,
    )
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const resources = row.digital_resources as { title: string } | { title: string }[] | null;
    const title = Array.isArray(resources)
      ? resources[0]?.title
      : resources?.title;

    return {
      id: row.id,
      resourceTitle: title ?? "Worksheet pack",
      buyerEmail: row.buyer_email,
      amountCents: row.amount_cents,
      platformFeeCents: row.platform_fee_cents,
      tutorNetCents: row.amount_cents - row.platform_fee_cents,
      createdAt: row.created_at,
    };
  });
}

export async function getStudentsForTutor(tutorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("tutor_id", tutorId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
