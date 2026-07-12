import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parentEmail = searchParams.get("email")?.trim().toLowerCase();
  const tutorId = searchParams.get("tutorId");

  if (!parentEmail || !tutorId) {
    return NextResponse.json({ credits: 0 });
  }

  const admin = createAdminClient();
  const { data: students } = await admin
    .from("students")
    .select("lesson_credits, credit_limit, student_name, parent_phone")
    .eq("tutor_id", tutorId)
    .eq("parent_email", parentEmail);

  if (!students || students.length === 0) {
    return NextResponse.json({ credits: 0, creditLimit: 0, studentName: null, parentPhone: null });
  }

  // Sum credits and credit limits across any student matches for that parent-tutor pair
  const totalCredits = students.reduce((sum, s) => sum + (s.lesson_credits ?? 0), 0);
  const totalCreditLimit = students.reduce((sum, s) => sum + (s.credit_limit ?? 0), 0);
  const primaryStudentName = students[0]?.student_name ?? null;
  const primaryPhone = (students[0] as any)?.parent_phone ?? null;

  return NextResponse.json({
    credits: totalCredits,
    creditLimit: totalCreditLimit,
    studentName: primaryStudentName,
    parentPhone: primaryPhone
  });
}
