import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TutorProfileRow } from "@/lib/supabase/database.types";

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
  // Slot alert emails are disabled to support purely in-app notifications
  return { recipientCount: 0, emailsSent: 0 };
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
