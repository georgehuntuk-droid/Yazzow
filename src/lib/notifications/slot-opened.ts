import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TutorProfileRow } from "@/lib/supabase/database.types";
import { sendResendEmail } from "@/lib/notifications/auth-email";
import { tutorPublicUrl } from "@/lib/constants";
import { formatSlotRange } from "@/lib/format";

export type SlotOpenedPayload = {
  tutorId: string;
  tutorUsername: string;
  tutorDisplayName: string;
  slotStartsAt: string;
  slotEndsAt: string;
  excludeParentEmail?: string | null;
};

export async function notifyFamiliesSlotOpened(
  payload: SlotOpenedPayload,
): Promise<{ recipientCount: number; emailsSent: number }> {
  const admin = createAdminClient();

  // 1. Fetch all subscribers for this tutor
  const { data: subscribers, error } = await admin
    .from("slot_alert_subscribers")
    .select("parent_email")
    .eq("tutor_id", payload.tutorId);

  if (error || !subscribers || subscribers.length === 0) {
    return { recipientCount: 0, emailsSent: 0 };
  }

  // 2. Filter out duplicate emails and the excluded parent email (e.g. the one who just cancelled)
  const recipientEmails = Array.from(
    new Set(
      subscribers
        .map((s) => s.parent_email.trim().toLowerCase())
        .filter((email) => email && email !== payload.excludeParentEmail?.trim().toLowerCase())
    )
  );

  if (recipientEmails.length === 0) {
    return { recipientCount: subscribers.length, emailsSent: 0 };
  }

  // 3. Format range and booking URL
  const formattedRange = formatSlotRange(payload.slotStartsAt, payload.slotEndsAt);
  const bookingUrl = tutorPublicUrl(payload.tutorUsername);

  const subject = `New lesson time opened with ${payload.tutorDisplayName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <!-- Logo Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
      </div>
      
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">New Lesson Slot Available!</h2>
      
      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
        A new lesson slot has just opened up with <strong>${payload.tutorDisplayName}</strong>:
      </p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; font-family: sans-serif;">
          ${formattedRange}
        </p>
      </div>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${bookingUrl}" style="background-color: #446152; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(68, 97, 82, 0.15); font-family: sans-serif;">Book Slot Now</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      
      <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0; font-family: sans-serif;">
        Slots are filled on a first-come, first-served basis. If you no longer wish to receive these alerts, you can manage your preferences on your student dashboard.
      </p>
    </div>
  `;

  // 4. Send emails via Resend in parallel
  let sentCount = 0;
  await Promise.all(
    recipientEmails.map(async (email) => {
      try {
        const sent = await sendResendEmail({
          to: email,
          subject,
          html,
        });
        if (sent) sentCount++;
      } catch (err) {
        console.error(`[notifyFamiliesSlotOpened] Failed to send email to ${email}:`, err);
      }
    })
  );

  return { recipientCount: recipientEmails.length, emailsSent: sentCount };
}

export type AvailabilityBlockPayload = {
  tutorId: string;
  tutorUsername: string;
  tutorDisplayName: string;
  slots: { startsAt: string; endsAt: string }[];
};

export async function notifyFamiliesNewAvailabilityBlock(
  payload: AvailabilityBlockPayload,
): Promise<{ recipientCount: number; emailsSent: number }> {
  if (payload.slots.length === 0) return { recipientCount: 0, emailsSent: 0 };
  
  const admin = createAdminClient();

  // 1. Fetch all subscribers for this tutor
  const { data: subscribers, error } = await admin
    .from("slot_alert_subscribers")
    .select("parent_email")
    .eq("tutor_id", payload.tutorId);

  if (error || !subscribers || subscribers.length === 0) {
    return { recipientCount: 0, emailsSent: 0 };
  }

  // 2. Filter out duplicate emails
  const recipientEmails = Array.from(
    new Set(subscribers.map((s) => s.parent_email.trim().toLowerCase()).filter(Boolean))
  );

  if (recipientEmails.length === 0) {
    return { recipientCount: subscribers.length, emailsSent: 0 };
  }

  const bookingUrl = tutorPublicUrl(payload.tutorUsername);

  // Group slots list for the HTML email
  const groupedList = payload.slots
    .map((s) => `<li>${formatSlotRange(s.startsAt, s.endsAt)}</li>`)
    .join("");

  const subject = `New lesson times added by ${payload.tutorDisplayName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <!-- Logo Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
      </div>
      
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">New Availability Added!</h2>
      
      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px; text-align: center; font-family: sans-serif;">
        <strong>${payload.tutorDisplayName}</strong> has just added new lesson slots to their calendar:
      </p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-family: sans-serif;">
        <ul style="margin: 0; padding-left: 20px; color: #0f172a; font-size: 14px; line-height: 1.8;">
          ${groupedList}
        </ul>
      </div>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${bookingUrl}" style="background-color: #446152; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(68, 97, 82, 0.15); font-family: sans-serif;">Book a Slot Now</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      
      <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0; font-family: sans-serif;">
        Slots are filled on a first-come, first-served basis. If you no longer wish to receive these alerts, you can manage your preferences on your student dashboard.
      </p>
    </div>
  `;

  // 3. Send emails via Resend in parallel
  let sentCount = 0;
  await Promise.all(
    recipientEmails.map(async (email) => {
      try {
        const sent = await sendResendEmail({
          to: email,
          subject,
          html,
        });
        if (sent) sentCount++;
      } catch (err) {
        console.error(`[notifyFamiliesNewAvailabilityBlock] Failed to send email to ${email}:`, err);
      }
    })
  );

  return { recipientCount: recipientEmails.length, emailsSent: sentCount };
}

export async function getTutorNotifyProfile(tutorId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tutor_profiles")
    .select("username, display_name")
    .eq("id", tutorId)
    .maybeSingle();

  return data as Pick<TutorProfileRow, "username" | "display_name"> | null;
}
