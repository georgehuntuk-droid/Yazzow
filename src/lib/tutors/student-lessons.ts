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
  status: "active" | "archived";
  archivedAt: string | null;
  createdAt: string;
  lessons: StudentLessonRecord[];
  tasks: StudentTaskRecord[];
  hasAccount: boolean;
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
): Promise<{ active: StudentWithLessons[]; archived: StudentWithLessons[] }> {
  const supabase = await createClient();
  const features = await getSchemaFeatures();

  const bookingSelect = features.lessonFeedback
    ? "id, slot_id, tutor_id, parent_email, student_name, amount_cents, status, tutor_lesson_feedback, lesson_rating, created_at, availability_slots (starts_at, ends_at)"
    : "id, slot_id, tutor_id, parent_email, student_name, amount_cents, status, created_at, availability_slots (starts_at, ends_at)";

  const [
    { data: students, error: studentsError },
    { data: bookings, error: bookingsError },
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

  const tasks = tasksResult?.data ?? [];

  // Load auth users to check if parents have registered accounts
  const admin = createAdminClient();
  const authEmails = new Set<string>();
  const nowTime = Date.now();
  
  if (cachedAuthEmails && (nowTime - cachedAuthEmails.timestamp < CACHE_TTL)) {
    cachedAuthEmails.emails.forEach((email) => authEmails.add(email));
  } else {
    try {
      const { data: usersData } = await admin.auth.admin.listUsers();
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
        return {
          id: b.id,
          startsAt: slot?.starts_at ?? b.created_at ?? "",
          endsAt: slot?.ends_at ?? b.created_at ?? "",
          status: b.status,
          amountCents: b.amount_cents,
          tutorLessonFeedback: b.tutor_lesson_feedback ?? null,
          lessonRating: b.lesson_rating ?? null,
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

    const status =
      features.studentStatus && row.status === "archived" ? "archived" : "active";

    return {
      id: student.id,
      studentName: student.student_name,
      parentEmail: student.parent_email,
      notes: student.notes,
      lessonCredits: (student as any).lesson_credits ?? 0,
      creditLimit: (student as any).credit_limit ?? 0,
      status: status as "active" | "archived",
      archivedAt: features.studentStatus ? (row.archived_at ?? null) : null,
      createdAt: student.created_at,
      lessons,
      tasks: studentTasks,
      hasAccount: authEmails.has(student.parent_email.toLowerCase()),
    };
  });

  return {
    active: mapped.filter((s) => s.status === "active"),
    archived: mapped.filter((s) => s.status === "archived"),
  };
}
