import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { PUBLIC_SITE_URL } from "@/lib/constants";

const TOKEN_VERSION = "v1";

function getSigningSecret(): string | null {
  return (
    process.env.SUPABASE_SECRET_KEY ??
    process.env.BOOKING_CANCEL_SECRET ??
    null
  );
}

/** Signed token parents use to view or cancel a booking without a Yazzow account. */
export function createBookingManageToken(bookingId: string): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;

  const signature = createHmac("sha256", secret)
    .update(`${TOKEN_VERSION}:${bookingId}`)
    .digest("base64url");

  return `${bookingId}.${signature}`;
}

export function verifyBookingManageToken(token: string): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const bookingId = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return null;

  const expected = createHmac("sha256", secret)
    .update(`${TOKEN_VERSION}:${bookingId}`)
    .digest("base64url");

  try {
    const provided = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (
      provided.length !== expectedBuf.length ||
      !timingSafeEqual(provided, expectedBuf)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return bookingId;
}

export function bookingManageUrl(bookingId: string): string | null {
  const token = createBookingManageToken(bookingId);
  if (!token) return null;
  return `${PUBLIC_SITE_URL}/booking/manage/${token}`;
}
