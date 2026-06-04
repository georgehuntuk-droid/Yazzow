import { PLATFORM_FEES } from "@/lib/constants";

export type FeeType = "digital";

/** Platform fee on digital goods only (lessons have no per-booking fee). */
export function getDigitalFeePercent(): number {
  return PLATFORM_FEES.digitalGoodsPercent;
}

/** Platform cut in cents (rounded). Tutor receives amountCents - platformFeeCents. */
export function calculatePlatformFee(amountCents: number): number {
  const percent = getDigitalFeePercent();
  if (percent <= 0) return 0;
  return Math.max(1, Math.round((amountCents * percent) / 100));
}

export function tutorPayoutCents(amountCents: number): number {
  return amountCents - calculatePlatformFee(amountCents);
}
