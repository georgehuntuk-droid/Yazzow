import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getTutorByUsername } from "@/lib/tutors/queries";

type RouteContext = {
  params: Promise<{ username: string }>;
};

type SlotAlertBody = {
  parentEmail?: string;
  studentName?: string;
};

export async function POST(request: Request, context: RouteContext) {
  const { username } = await context.params;
  const tutor = await getTutorByUsername(username);

  if (!tutor) {
    return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
  }

  const body = (await request.json()) as SlotAlertBody;
  const parentEmail = body.parentEmail?.trim().toLowerCase();
  const studentName = body.studentName?.trim() || null;

  if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("slot_alert_subscribers").upsert(
    {
      tutor_id: tutor.id,
      parent_email: parentEmail,
      student_name: studentName,
    },
    { onConflict: "tutor_id,parent_email" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
