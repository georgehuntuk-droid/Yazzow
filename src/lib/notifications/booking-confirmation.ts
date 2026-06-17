import "server-only";

export async function sendBookingConfirmationEmail(input: {
  bookingId: string;
  parentEmail?: string; // support old parameter names gracefully
  to?: string;
  tutorName: string;
  tutorUsername: string;
  studentName: string | null;
  slotStartsAt?: string; // support old parameter names gracefully
  startsAt?: string;
  slotEndsAt?: string; // support old parameter names gracefully
  endsAt?: string;
  amountCents: number;
  currency: string;
  isCreditPayment?: boolean;
  paymentInstructions?: string | null;
  status?: string;
  isApprovedNotice?: boolean;
}): Promise<boolean> {
  // Booking confirmation emails are disabled to support purely in-app notifications
  return true;
}
