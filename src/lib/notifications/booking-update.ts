import "server-only";

import { formatSlotRange } from "@/lib/format";

export async function sendRunningLateEmail(input: {
  to: string;
  tutorName: string;
  studentName: string | null;
  slotLabel: string;
  tutorUsername: string;
  note?: string | null;
}): Promise<boolean> {
  return true;
}

export async function sendStudentRunningLateEmail(input: {
  to: string;
  tutorName: string;
  studentName: string | null;
  slotLabel: string;
  note?: string | null;
}): Promise<boolean> {
  return true;
}

export function formatRunningLateSlotLabel(startsAt: string, endsAt: string): string {
  return formatSlotRange(startsAt, endsAt);
}
