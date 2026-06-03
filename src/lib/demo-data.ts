import type { DigitalResource, OpenSlot, StudentLedgerEntry, TutorProfile } from "@/lib/types";

export const DEMO_TUTOR: TutorProfile = {
  id: "demo-tutor-1",
  username: "maya-chen",
  displayName: "Maya Chen",
  headline: "KS3 & GCSE Maths · calm, structured sessions",
  bio: "I help students build confidence with number sense, algebra, and exam technique. Every lesson is tailored — no marketplace noise, just your child's progress.",
  lessonPriceCents: 4500,
  currency: "gbp",
};

export const DEMO_OPEN_SLOTS: OpenSlot[] = [
  {
    id: "slot-1",
    startsAt: "2026-06-04T16:00:00.000Z",
    endsAt: "2026-06-04T17:00:00.000Z",
    available: true,
  },
  {
    id: "slot-2",
    startsAt: "2026-06-05T10:00:00.000Z",
    endsAt: "2026-06-05T11:00:00.000Z",
    available: true,
  },
  {
    id: "slot-3",
    startsAt: "2026-06-06T14:00:00.000Z",
    endsAt: "2026-06-06T15:00:00.000Z",
    available: true,
  },
];

export const DEMO_RESOURCES: DigitalResource[] = [
  {
    id: "res-1",
    title: "Algebra Foundations Pack",
    description: "12 printable worksheets with worked examples and parent answer key.",
    priceCents: 1200,
    currency: "gbp",
  },
  {
    id: "res-2",
    title: "GCSE Paper 2 Warm-Up",
    description: "Timed practice set + marking guide for weekend revision.",
    priceCents: 1800,
    currency: "gbp",
  },
];

export const DEMO_LEDGER: StudentLedgerEntry[] = [
  {
    id: "stu-1",
    studentName: "Amelia R.",
    parentEmail: "parent@example.com",
    lessonsCompleted: 8,
    totalRevenueCents: 36000,
  },
  {
    id: "stu-2",
    studentName: "Noah T.",
    parentEmail: "family@example.com",
    lessonsCompleted: 3,
    totalRevenueCents: 13500,
  },
];

export function getDemoTutorByUsername(username: string): TutorProfile | null {
  if (username === DEMO_TUTOR.username || username === "demo") {
    return { ...DEMO_TUTOR, username: username === "demo" ? "demo" : DEMO_TUTOR.username };
  }
  return null;
}
