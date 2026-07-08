import type { DigitalResource, OpenSlot, StudentLedgerEntry, TutorProfile, TutorPackage } from "@/lib/types";

export const DEMO_TUTOR: TutorProfile = {
  id: "demo-tutor-1",
  username: "maya-chen",
  displayName: "Maya Chen",
  headline: "KS3 & GCSE Maths · calm, structured sessions",
  bio: "I help students build confidence with number sense, algebra, and exam technique. Every lesson is tailored — no marketplace noise, just your child's progress.",
  lessonPriceCents: 4500,
  currency: "gbp",
  portalAccentOklch: "oklch(0.45 0.12 195)", // Calm teal theme
  portalWelcomeMessage: "Welcome to my teaching space! I'm a full-time professional mathematics tutor helping students excel at GCSE and KS3 level. Select a slot below to request a booking, or download my algebra foundations packet.",
  portalAnnouncementActive: true,
  portalAnnouncement: "📚 GCSE Summer Revision Slots now open! Book packages below to secure your slots.",
  portalAnnouncementUpdatedAt: new Date().toISOString(),
  portalAnnouncementDurationHours: 72,
  avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
  coverUrl: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1000&auto=format&fit=crop&q=80",
};

export const DEMO_PACKAGES: TutorPackage[] = [
  {
    id: "pack-1",
    tutorId: "demo-tutor-1",
    name: "5 GCSE Maths Lessons Boost",
    lessonsCount: 5,
    priceCents: 200_00, // £200 (£40/lesson, saving £25)
    currency: "gbp",
    isActive: true,
  },
  {
    id: "pack-2",
    tutorId: "demo-tutor-1",
    name: "10 GCSE Maths Lessons Exam Prep",
    lessonsCount: 10,
    priceCents: 380_00, // £380 (£38/lesson, saving £70)
    currency: "gbp",
    isActive: true,
  },
];

// Helper to get future dates relative to today in UTC/ISO format
const getFutureDate = (daysAhead: number, hour: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const DEMO_OPEN_SLOTS: OpenSlot[] = [
  {
    id: "slot-1",
    startsAt: getFutureDate(1, 16), // Tomorrow at 4:00 PM UTC
    endsAt: getFutureDate(1, 17),
    available: true,
  },
  {
    id: "slot-2",
    startsAt: getFutureDate(2, 10), // Day after tomorrow at 10:00 AM UTC
    endsAt: getFutureDate(2, 11),
    available: true,
  },
  {
    id: "slot-3",
    startsAt: getFutureDate(3, 14), // In 3 days at 2:00 PM UTC
    endsAt: getFutureDate(3, 15),
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
