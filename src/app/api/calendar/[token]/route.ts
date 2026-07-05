import { buildIcsCalendar } from "@/lib/calendar/ics";
import {
  getCalendarEventsForFeed,
  getTutorIdByFeedToken,
} from "@/lib/calendar/queries";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  if (!token || token.length < 32) {
    return new Response("Not found", { status: 404 });
  }

  const tutorId = await getTutorIdByFeedToken(token);
  if (!tutorId) {
    return new Response("Not found", { status: 404 });
  }

  const { tutorName, events } = await getCalendarEventsForFeed(tutorId);

  const ics = buildIcsCalendar({
    calendarName: `${tutorName} · Yazzow lessons`,
    events: events.map((event) => ({
      uid: `booking-${event.bookingId}@yazzow.com`,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      summary: event.studentName
        ? `Lesson · ${event.studentName}`
        : "Yazzow lesson",
      description: `Parent: ${event.parentEmail}\nLesson Format: ${event.lessonType === "visiting" ? "Visiting / In-Person" : "Online"}${event.meetingLink ? `\nMeeting Link: ${event.meetingLink}` : ""}\nBooked on Yazzow`,
      location: event.meetingLink || (event.lessonType === "visiting" ? "Visiting / In-Person" : undefined),
    })),
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="yazzow-lessons.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
