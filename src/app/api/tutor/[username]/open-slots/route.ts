import { NextResponse } from "next/server";

import { getTutorByUsername } from "@/lib/tutors/queries";
import { getOpenSlotsForTutor } from "@/lib/tutors/portal-data";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { username } = await context.params;
  const tutor = await getTutorByUsername(username);

  if (!tutor) {
    return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
  }

  const slots = await getOpenSlotsForTutor(tutor.id);
  return NextResponse.json({ slots });
}
