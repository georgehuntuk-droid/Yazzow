import { PLATFORM_FEES } from "@/lib/constants";

export type FeeType = "lesson" | "digital";

export function getFeePercent(type: FeeType): number {
  return type === "lesson"
    ? PLATFORM_FEES.lessonBookingPercent
    : PLATFORM_FEES.digitalGoodsPercent;
}

/** Platform cut in cents (rounded). Tutor receives amountCents - platformFeeCents. */
export function calculatePlatformFee(amountCents: number, type: FeeType): number {
  const percent = getFeePercent(type);
  return Math.max(1, Math.round((amountCents * percent) / 100));
}

export function tutorPayoutCents(amountCents: number, type: FeeType): number {
  return amountCents - calculatePlatformFee(amountCents, type);
}
