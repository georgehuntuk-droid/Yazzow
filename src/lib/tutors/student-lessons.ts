import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSchemaFeatures } from "@/lib/supabase/schema-features";
import type { BookingRow, StudentRow } from "@/lib/supabase/database.types";

export type StudentLessonRecord = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  amountCents: number;
  tutorLessonFeedback: string | null;
  lessonRating: number | null;
  isPaid: boolean;
  stripePaymentIntentId: string | null;
  studentRunningLateSentAt?: string | null;
};

export type StudentTaskRecord = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "completed";
  tutorFeedback: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type StudentWithLessons = {
  id: string;
  studentName: string;
  parentEmail: string;
  notes: string | null;
  lessonCredits: number;
  creditLimit: number;
  status: "active" | "archived" | "pending";
  archivedAt: string | null;
  createdAt: string;
  lessons: StudentLessonRecord[];
  tasks: StudentTaskRecord[];
  hasAccount: boolean;
  owedAmountCents: number;
  lessonType: "online" | "visiting";
  alertsEnabled: boolean;
};

type BookingWithSlot = BookingRow & {
  availability_slots?:
    | { starts_at: string; ends_at: string }
    | { starts_at: string; ends_at: string }[]
    | null;
  tutor_lesson_feedback?: string | null;
  lesson_rating?: number | null;
  created_at?: string;
};

function bookingMatchesStudent(booking: BookingWithSlot, student: StudentRow): boolean {
  if (booking.parent_email.toLowerCase() !== student.parent_email.toLowerCase()) {
    return false;
  }
  if (!booking.student_name) {
    return true;
  }
  return (
    booking.student_name.trim().toLowerCase() ===
    student.student_name.trim().toLowerCase()
  );
}

// Memory cache for user emails to avoid slow listUsers() calls on every page render
let cachedAuthEmails: { emails: Set<string>; timestamp: number } | null = null;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function getStudentsWithLessonsForTutor(
  tutorId: string,
): Promise<{ active: StudentWithLessons[]; archived: StudentWithLessons[]; pending: StudentWithLessons[] }> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;
  if (testVal === "dashboard") {
    return {
      active: [
        {
          id: "student-mock-1",
          studentName: "Bobby",
          parentEmail: "testparent@example.com",
          notes: "Focusing on algebra basics.",
          lessonCredits: 4,
          creditLimit: 0,
          status: "active",
          archivedAt: null,
          createdAt: new Date().toISOString(),
          lessons: [
            {
              id: "booking-mock-1",
              startsAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
              endsAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
              status: "confirmed",
              amountCents: 4500,
              tutorLessonFeedback: null,
              lessonRating: null,
              isPaid: true,
              stripePaymentIntentId: "mock-payment-intent-123",
            },
          ],
          tasks: [],
          hasAccount: true,
          owedAmountCents: 0,
          lessonType: "online",
          alertsEnabled: true,
        },
      ],
      archived: [],
      pending: [],
    };
  }

  // Trigger automated payment reminders passively in the background
  const { runAutomatedPaymentReminders } = await import("@/lib/bookings/payment-reminders");
  void runAutomatedPaymentReminders(tutorId).catch((err) => {
    console.error("Failed to run automated payment reminders background check:", err);
  });

  const supabase = await createClient();
  const features = await getSchemaFeatures();

  let bookingSelect = features.lessonFeedback
    ? "id, slot_id, tutor_id, parent_email, student_name, amount_cents, status, tutor_lesson_feedback, lesson_rating, created_at, is_paid, stripe_payment_intent_id, student_running_late_sent_at, availability_slots (starts_at, ends_at)"
    : "id, slot_id, tutor_id, parent_email, student_name, amount_cents, status, created_at, is_paid, stripe_payment_intent_id, student_running_late_sent_at, availability_slots (starts_at, ends_at)";

  const [
    { data: students, error: studentsError },
    bookingsRes,
    tasksResult,
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*")
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select(bookingSelect)
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false }),
    Promise.resolve(
      supabase
        .from("student_tasks")
        .select("*")
        .eq("tutor_id", tutorId)
        .order("created_at", { ascending: false })
    )
      .then((res) => res)
      .catch((err) => ({ data: [], error: err })),
  ]);

  let bookings = bookingsRes.data;
  let bookingsError = bookingsRes.error;

  if (bookingsError && (bookingsError.code === "42703" || bookingsError.message.includes("is_paid"))) {
    bookingSelect = features.lessonFeedback
      ? "id, slot_id, tutor_id, parent_email, student_name, amount_cents, status, tutor_lesson_feedback, lesson_rating, created_at, stripe_payment_intent_id, student_running_late_sent_at, availability_slots (starts_at, ends_at)"
      : "id, slot_id, tutor_id, parent_email, student_name, amount_cents, status, created_at, stripe_payment_intent_id, student_running_late_sent_at, availability_slots (starts_at, ends_at)";

    const retryRes = await supabase
      .from("bookings")
      .select(bookingSelect)
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false });
    
    bookings = retryRes.data;
    bookingsError = retryRes.error;
  }

  const tasks = tasksResult?.data ?? [];

  // Load auth users to check if parents have registered accounts
  const admin = createAdminClient();
  const authEmails = new Set<string>();
  const nowTime = Date.now();

  const { data: subscribers } = await admin
    .from("slot_alert_subscribers")
    .select("parent_email, student_name")
    .eq("tutor_id", tutorId);
  
  if (cachedAuthEmails && (nowTime - cachedAuthEmails.timestamp < CACHE_TTL)) {
    cachedAuthEmails.emails.forEach((email) => authEmails.add(email));
  } else {
    try {
      const resList = await admin.auth.admin.listUsers();
      const usersData = resList?.data;
      if (usersData?.users) {
        usersData.users.forEach((u) => {
          if (u.email) authEmails.add(u.email.toLowerCase());
        });
      }
      cachedAuthEmails = { emails: new Set(authEmails), timestamp: nowTime };
    } catch (err) {
      console.warn("Could not list auth users for email confirmation check:", err);
    }
  }

  if (studentsError) throw studentsError;
  if (bookingsError) throw bookingsError;

  const studentRows = (students ?? []) as StudentRow[];
  const bookingRows = (bookings ?? []) as unknown as BookingWithSlot[];

  const mapped = studentRows.map((student) => {
    const row = student as StudentRow & {
      status?: string;
      archived_at?: string | null;
    };
    const lessons: StudentLessonRecord[] = bookingRows
      .filter((b) => bookingMatchesStudent(b, student))
      .map((b) => {
        const slot = Array.isArray(b.availability_slots)
          ? b.availability_slots[0]
          : b.availability_slots;
        
        const isPaid = (b as any).is_paid !== undefined
          ? (b as any).is_paid
          : (b.stripe_payment_intent_id !== "cash");

        return {
          id: b.id,
          startsAt: slot?.starts_at ?? b.created_at ?? "",
          endsAt: slot?.ends_at ?? b.created_at ?? "",
          status: b.status,
          amountCents: b.amount_cents,
          tutorLessonFeedback: b.tutor_lesson_feedback ?? null,
          lessonRating: b.lesson_rating ?? null,
          isPaid,
          stripePaymentIntentId: b.stripe_payment_intent_id ?? null,
          studentRunningLateSentAt: (b as any).student_running_late_sent_at ?? null,
        };
      });

    const studentTasks = tasks
      .filter((t) => t.student_id === student.id)
      .map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status as "pending" | "completed",
        tutorFeedback: t.tutor_feedback,
        createdAt: t.created_at,
        completedAt: t.completed_at,
      }));

    let status: "active" | "archived" | "pending" = "active";
    if (features.studentStatus) {
      if (row.status === "archived") status = "archived";
      else if (row.status === "pending") status = "pending";
    }

    const owedAmountCents = lessons
      .filter((l) => l.status === "confirmed" && !l.isPaid)
      .reduce((sum, l) => sum + l.amountCents, 0);

    const parentEmailLower = student.parent_email?.trim().toLowerCase();
    const studentNameLower = student.student_name?.trim().toLowerCase();
    const alertsEnabled = (subscribers ?? []).some(
      (sub) => 
        sub.parent_email.trim().toLowerCase() === parentEmailLower && 
        (!studentNameLower || (sub.student_name || "").trim().toLowerCase() === studentNameLower)
    );

    return {
      id: student.id,
      studentName: student.student_name,
      parentEmail: student.parent_email,
      notes: student.notes,
      lessonCredits: (student as any).lesson_credits ?? 0,
      creditLimit: (student as any).credit_limit ?? 0,
      status,
      archivedAt: features.studentStatus ? (row.archived_at ?? null) : null,
      createdAt: student.created_at,
      lessons,
      tasks: studentTasks,
      hasAccount: student.parent_email ? authEmails.has(student.parent_email.toLowerCase()) : false,
      owedAmountCents,
      lessonType: ((student as any).lesson_type as "online" | "visiting") ?? "online",
      alertsEnabled,
    };
  });

  return {
    active: mapped.filter((s) => s.status === "active"),
    archived: mapped.filter((s) => s.status === "archived"),
    pending: mapped.filter((s) => s.status === "pending"),
  };
}
