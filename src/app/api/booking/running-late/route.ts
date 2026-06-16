import { NextResponse } from "next/server";
import { verifyBookingManageToken } from "@/lib/bookings/manage-token";
import { sendStudentRunningLateNotice } from "@/lib/bookings/running-late";

export async function POST(request: Request) {
  try {
    const { token, note } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token." }, { status: 400 });
    }

    const bookingId = verifyBookingManageToken(token);
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    const result = await sendStudentRunningLateNotice({
      bookingId,
      note,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, emailed: result.emailed });
  } catch (error) {
    console.error("Student running late API error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
