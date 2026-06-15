export type TutorProfile = {
  id: string;
  username: string;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl?: string;
  coverUrl?: string;
  portalWelcomeMessage?: string;
  portalAccentOklch?: string;
  lessonPriceCents: number;
  currency: string;
  blockPackageLessonsCount?: number;
  blockPackageDiscountPercent?: number;
  isPlatformAdmin?: boolean;
  allowPublicJoining?: boolean;
  allowCashPayments?: boolean;
  paymentInstructions?: string;
  portalAnnouncement?: string;
  portalAnnouncementActive?: boolean;
};

export type OpenSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
};

export type DigitalResource = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  thumbnailUrl?: string;
  currency: string;
  isPublished?: boolean;
};

export type TutorSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  isBooked: boolean;
  booking?: {
    id: string;
    parentEmail: string;
    studentName: string | null;
    status: string;
    runningLateSentAt: string | null;
    runningLateNote: string | null;
  } | null;
};

export type RecentBooking = {
  id: string;
  slotId: string;
  parentEmail: string;
  studentName: string | null;
  amountCents: number;
  status: string;
  createdAt: string;
  startsAt: string;
  endsAt: string;
  runningLateSentAt: string | null;
  runningLateNote: string | null;
};

export type StudentLedgerEntry = {
  id: string;
  studentName: string;
  parentEmail: string;
  lessonsCompleted: number;
  totalRevenueCents: number;
};

export type TutorPackage = {
  id: string;
  tutorId: string;
  name: string;
  lessonsCount: number;
  priceCents: number;
  currency: string;
  isActive: boolean;
};
