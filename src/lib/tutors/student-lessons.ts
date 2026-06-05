import { createClient } from "@/lib/supabase/server";
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

export type StudentWithLessons = {
  id: string;
  studentName: string;
  parentEmail: string;
  notes: string | null;
  lessonCredits: number;
  status: "active" | "archived";
  archivedAt: string | null;
  createdAt: string;
  lessons: StudentLessonRecord[];
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

export async function getStudentsWithLessonsForTutor(
  tutorId: string,
): Promise<{ active: StudentWithLessons[]; archived: StudentWithLessons[] }> {
  const supabase = await createClient();
  const features = await getSchemaFeatures();

  const bookingSelect = features.lessonFeedback
    ? "id, slot_id, tutor_id, parent_email, student_name, amount_cents, status, tutor_lesson_feedback, lesson_rating, created_at, availability_slots (starts_at, ends_at)"
    : "id, slot_id, tutor_id, parent_email, student_name, amount_cents, status, created_at, availability_slots (starts_at, ends_at)";

  const [{ data: students, error: studentsError }, { data: bookings, error: bookingsError }] =
    await Promise.all([
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
    ]);

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

    const status =
      features.studentStatus && row.status === "archived" ? "archived" : "active";

    return {
      id: student.id,
      studentName: student.student_name,
      parentEmail: student.parent_email,
      notes: student.notes,
      lessonCredits: (student as any).lesson_credits ?? 0,
      status: status as "active" | "archived",
      archivedAt: features.studentStatus ? (row.archived_at ?? null) : null,
      createdAt: student.created_at,
      lessons,
    };
  });

  return {
    active: mapped.filter((s) => s.status === "active"),
    archived: mapped.filter((s) => s.status === "archived"),
  };
}
