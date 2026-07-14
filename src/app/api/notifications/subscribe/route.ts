import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SubscribeBody = {
  subscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  userId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubscribeBody;
    const { subscription, userId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("push_subscriptions").upsert(
      {
        user_id: userId || null,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("[api/notifications/subscribe] DB Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[api/notifications/subscribe] Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
