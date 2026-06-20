import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
const contactEmail = process.env.SUPPORT_INBOX_EMAIL?.trim() || "support@yazzow.com";

if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(
      `mailto:${contactEmail}`,
      publicKey,
      privateKey
    );
  } catch (err: any) {
    console.error("[Web Push] Failed to set VAPID details:", err.message);
  }
} else {
  console.warn("[Web Push] VAPID keys are missing. Push notifications will be disabled.");
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<{ successCount: number; failureCount: number }> {
  if (!publicKey || !privateKey) {
    return { successCount: 0, failureCount: 0 };
  }

  const admin = createAdminClient();
  
  // Query all active push subscriptions for this user
  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  let successCount = 0;
  let failureCount = 0;
  const deadSubscriptionIds: string[] = [];

  const promises = subscriptions.map(async (sub) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || "/dashboard",
        })
      );
      successCount++;
    } catch (err: any) {
      console.error(`[Web Push] Error sending to subscription ${sub.id}:`, err.message);
      failureCount++;
      
      // If the subscription is expired or invalid (410 Gone or 404 Not Found), mark it for deletion
      if (err.statusCode === 410 || err.statusCode === 404) {
        deadSubscriptionIds.push(sub.id);
      }
    }
  });

  await Promise.all(promises);

  // Clean up expired subscriptions from the database
  if (deadSubscriptionIds.length > 0) {
    await admin
      .from("push_subscriptions")
      .delete()
      .in("id", deadSubscriptionIds);
    console.log(`[Web Push] Cleaned up ${deadSubscriptionIds.length} expired subscriptions.`);
  }

  return { successCount, failureCount };
}
