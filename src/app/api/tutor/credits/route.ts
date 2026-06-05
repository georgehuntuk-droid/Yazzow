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
    .select("lesson_credits")
    .eq("tutor_id", tutorId)
    .eq("parent_email", parentEmail);

  if (!students || students.length === 0) {
    return NextResponse.json({ credits: 0 });
  }

  // Sum credits across any students matches for that parent-tutor pair
  const totalCredits = students.reduce((sum, s) => sum + (s.lesson_credits ?? 0), 0);

  return NextResponse.json({ credits: totalCredits });
}
