import { LESSON_SLOT_DURATION_MINUTES } from "@/lib/constants";

export type HourlySlotWindow = {
  startsAt: Date;
  endsAt: Date;
};

export function splitAvailabilityIntoHourlySlots(
  startsAt: Date,
  endsAt: Date,
): HourlySlotWindow[] {
  const durationMs = LESSON_SLOT_DURATION_MINUTES * 60 * 1000;
  const totalMs = endsAt.getTime() - startsAt.getTime();

  if (totalMs < durationMs) {
    return [];
  }

  if (totalMs % durationMs !== 0) {
    return [];
  }

  const windows: HourlySlotWindow[] = [];
  let cursor = startsAt.getTime();
  const endMs = endsAt.getTime();

  while (cursor + durationMs <= endMs) {
    windows.push({
      startsAt: new Date(cursor),
      endsAt: new Date(cursor + durationMs),
    });
    cursor += durationMs;
  }

  return windows;
}

export function countHourlySlots(startsAt: Date, endsAt: Date): number {
  return splitAvailabilityIntoHourlySlots(startsAt, endsAt).length;
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
