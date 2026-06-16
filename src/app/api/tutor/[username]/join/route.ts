import { NextResponse } from "next/server";

import { joinTutorFamily } from "@/lib/tutors/join-family";
import { getTutorByUsername } from "@/lib/tutors/queries";

type RouteContext = {
  params: Promise<{ username: string }>;
};

type JoinBody = {
  parentEmail?: string;
  studentName?: string;
  password?: string;
};

export async function POST(request: Request, context: RouteContext) {
  const { username } = await context.params;
  const tutor = await getTutorByUsername(username);

  if (!tutor) {
    return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
  }

  const body = (await request.json()) as JoinBody;
  const origin = request.headers.get("origin") || undefined;

  const result = await joinTutorFamily({
    tutorId: tutor.id,
    parentEmail: body.parentEmail ?? "",
    studentName: body.studentName ?? "",
    password: body.password || undefined,
    origin,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tutorDisplayName: tutor.displayName });
}
