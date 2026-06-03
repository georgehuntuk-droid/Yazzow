import { NextResponse } from "next/server";

import { cancelBookingByManageToken } from "@/lib/bookings/booking-manage";

export const runtime = "nodejs";

type CancelBody = {
  token?: string;
};

export async function POST(request: Request) {
  let body: CancelBody;

  try {
    body = (await request.json()) as CancelBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing booking link." }, { status: 400 });
  }

  const result = await cancelBookingByManageToken(token);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
