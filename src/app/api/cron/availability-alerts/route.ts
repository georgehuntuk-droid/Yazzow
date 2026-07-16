import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyFamiliesNewAvailabilityBlock, getTutorNotifyProfile } from "@/lib/notifications/slot-opened";

export async function GET(request: Request) {
  // 1. Authenticate Cron Job
  const authHeader = request.headers.get("Authorization");
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || url.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret) {
    const isAuthorized =
      authHeader === `Bearer ${expectedSecret}` || token === expectedSecret;
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const now = new Date();

  // 2. Fetch all unnotified, open availability slots
  const { data: slots, error: slotsError } = await admin
    .from("availability_slots")
    .select("id, tutor_id, starts_at, ends_at, created_at")
    .eq("is_booked", false)
    .eq("notified", false);

  if (slotsError) {
    console.error("[Cron Availability Alerts] Failed to fetch slots:", slotsError);
    return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  if (!slots || slots.length === 0) {
    return NextResponse.json({ message: "No unnotified slots found." });
  }

  // 3. Group slots by tutor_id
  const slotsByTutor: Record<string, typeof slots> = {};
  for (const slot of slots) {
    if (!slotsByTutor[slot.tutor_id]) {
      slotsByTutor[slot.tutor_id] = [];
    }
    slotsByTutor[slot.tutor_id].push(slot);
  }

  const results = [];
  const delayMs = 20 * 60 * 1000; // 20 minutes delay

  // 4. Process each tutor's slots
  for (const tutorId in slotsByTutor) {
    const tutorSlots = slotsByTutor[tutorId];

    // Find the latest created_at timestamp
    const latestCreatedTime = Math.max(
      ...tutorSlots.map((s) => new Date(s.created_at).getTime())
    );

    const timeDiff = now.getTime() - latestCreatedTime;

    if (timeDiff < delayMs) {
      console.log(
        `[Cron Availability Alerts] Skipping tutor ${tutorId}: last slot created ${(
          timeDiff / 1000 / 60
        ).toFixed(1)} mins ago (less than 20 mins).`
      );
      continue;
    }

    try {
      // Fetch tutor profile details
      const profile = await getTutorNotifyProfile(tutorId);
      if (!profile) {
        console.warn(`[Cron Availability Alerts] Profile not found for tutor ${tutorId}`);
        continue;
      }

      // Sort slots chronologically
      tutorSlots.sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );

      console.log(
        `[Cron Availability Alerts] Sending digest for tutor ${profile.display_name} (${tutorSlots.length} slots)`
      );

      // Send the digest email
      const notifyRes = await notifyFamiliesNewAvailabilityBlock({
        tutorId,
        tutorUsername: profile.username,
        tutorDisplayName: profile.display_name,
        slots: tutorSlots.map((s) => ({
          startsAt: s.starts_at,
          endsAt: s.ends_at,
        })),
      });

      // Mark these slots as notified
      const slotIds = tutorSlots.map((s) => s.id);
      const { error: updateError } = await admin
        .from("availability_slots")
        .update({ notified: true })
        .in("id", slotIds);

      if (updateError) {
        console.error(
          `[Cron Availability Alerts] Failed to update notified status for slots ${slotIds.join(
            ", "
          )}:`,
          updateError
        );
      }

      results.push({
        tutorId,
        tutorName: profile.display_name,
        slotsCount: tutorSlots.length,
        emailsSent: notifyRes.emailsSent,
        success: true,
      });
    } catch (err) {
      console.error(
        `[Cron Availability Alerts] Error processing alerts for tutor ${tutorId}:`,
        err
      );
      results.push({
        tutorId,
        error: err instanceof Error ? err.message : String(err),
        success: false,
      });
    }
  }

  return NextResponse.json({
    processedTutorsCount: results.length,
    results,
  });
}
