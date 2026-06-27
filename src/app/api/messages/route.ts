import { NextResponse } from "next/server";

import { verifyBookingManageToken } from "@/lib/bookings/manage-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeGetAuthUser } from "@/lib/supabase/server";
import { getTutorProfileForUser } from "@/lib/tutors/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const parentEmailParam = searchParams.get("parentEmail");

    const admin = createAdminClient();

    // 1. Parent context (using token)
    if (token) {
      const bookingId = verifyBookingManageToken(token);
      if (!bookingId) {
        return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
      }

      // Fetch booking details to get tutor_id and parent_email
      const { data: booking, error: bookingErr } = await admin
        .from("bookings")
        .select("tutor_id, parent_email")
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingErr || !booking) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }

      const { tutor_id: tutorId, parent_email: parentEmail } = booking;

      // Fetch messages
      const { data: messages, error: msgErr } = await admin
        .from("messages")
        .select("*")
        .eq("tutor_id", tutorId)
        .eq("parent_email", parentEmail)
        .order("created_at", { ascending: true });

      if (msgErr) {
        return NextResponse.json({ error: "Failed to retrieve messages." }, { status: 500 });
      }

      // Mark tutor messages as read
      await admin
        .from("messages")
        .update({ is_read: true })
        .eq("tutor_id", tutorId)
        .eq("parent_email", parentEmail)
        .eq("sender", "tutor");

      return NextResponse.json({ ok: true, messages });
    }

    // 2. Logged-in user context
    const user = await safeGetAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutor = await getTutorProfileForUser(user.id);
    if (tutor) {
      // If viewing a specific thread
      if (parentEmailParam) {
      const parentEmail = parentEmailParam.trim().toLowerCase();

      // Fetch messages
      const { data: messages, error: msgErr } = await admin
        .from("messages")
        .select("*")
        .eq("tutor_id", tutor.id)
        .eq("parent_email", parentEmail)
        .order("created_at", { ascending: true });

      if (msgErr) {
        return NextResponse.json({ error: "Failed to retrieve messages." }, { status: 500 });
      }

      // Mark parent messages as read
      await admin
        .from("messages")
        .update({ is_read: true })
        .eq("tutor_id", tutor.id)
        .eq("parent_email", parentEmail)
        .eq("sender", "parent");

      return NextResponse.json({ ok: true, messages });
    }

    // If listing all threads
    const { data: messages, error: msgErr } = await admin
      .from("messages")
      .select("*")
      .eq("tutor_id", tutor.id)
      .order("created_at", { ascending: false });

    if (msgErr) {
      return NextResponse.json({ error: "Failed to retrieve threads." }, { status: 500 });
    }

    // Fetch students list to map emails to friendly names
    const { data: students } = await admin
      .from("students")
      .select("parent_email, student_name")
      .eq("tutor_id", tutor.id);

    const emailToStudentName: Record<string, string> = {};
    students?.forEach((s) => {
      if (s.parent_email && s.student_name) {
        // Prefer first student name or append if multiple
        const existing = emailToStudentName[s.parent_email.toLowerCase()];
        if (existing) {
          if (!existing.includes(s.student_name)) {
            emailToStudentName[s.parent_email.toLowerCase()] = `${existing}, ${s.student_name}`;
          }
        } else {
          emailToStudentName[s.parent_email.toLowerCase()] = s.student_name;
        }
      }
    });

    // Group messages into thread list
    const threadsMap: Record<
      string,
      {
        parentEmail: string;
        studentName: string | null;
        latestMessageContent: string;
        latestMessageTime: string;
        unreadCount: number;
      }
    > = {};

    messages.forEach((msg) => {
      const email = msg.parent_email.toLowerCase();
      if (!threadsMap[email]) {
        threadsMap[email] = {
          parentEmail: msg.parent_email,
          studentName: emailToStudentName[email] || null,
          latestMessageContent: msg.content,
          latestMessageTime: msg.created_at,
          unreadCount: 0,
        };
      }
      if (msg.sender === "parent" && !msg.is_read) {
        threadsMap[email].unreadCount += 1;
      }
    });

    const threads = Object.values(threadsMap).sort(
      (a, b) => new Date(b.latestMessageTime).getTime() - new Date(a.latestMessageTime).getTime()
    );

    return NextResponse.json({ ok: true, threads });
    } else {
      // Parent context (using logged-in user email)
      const tutorId = searchParams.get("tutorId");
      if (!tutorId) {
        return NextResponse.json({ error: "Tutor ID is required." }, { status: 400 });
      }

      // Verify parent is connected with the tutor
      const { data: student } = await admin
        .from("students")
        .select("id")
        .eq("tutor_id", tutorId)
        .eq("parent_email", user.email)
        .eq("status", "active")
        .maybeSingle();

      if (!student) {
        return NextResponse.json({ error: "Unauthorized access to tutor thread." }, { status: 403 });
      }

      // Fetch messages
      const { data: messages, error: msgErr } = await admin
        .from("messages")
        .select("*")
        .eq("tutor_id", tutorId)
        .eq("parent_email", user.email)
        .order("created_at", { ascending: true });

      if (msgErr) {
        return NextResponse.json({ error: "Failed to retrieve messages." }, { status: 500 });
      }

      // Mark tutor messages as read for this parent
      await admin
        .from("messages")
        .update({ is_read: true })
        .eq("tutor_id", tutorId)
        .eq("parent_email", user.email)
        .eq("sender", "tutor");

      return NextResponse.json({ ok: true, messages });
    }
  } catch (error) {
    console.error("Messages endpoint GET error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, parentEmail: parentEmailParam, content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required." }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Parent sending message (using token)
    if (token) {
      const bookingId = verifyBookingManageToken(token);
      if (!bookingId) {
        return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
      }

      // Fetch booking details to get tutor_id and parent_email
      const { data: booking, error: bookingErr } = await admin
        .from("bookings")
        .select("tutor_id, parent_email")
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingErr || !booking) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }

      const { tutor_id: tutorId, parent_email: parentEmail } = booking;

      // Insert message
      const { data: message, error: insErr } = await admin
        .from("messages")
        .insert({
          tutor_id: tutorId,
          parent_email: parentEmail,
          sender: "parent",
          content: content.trim(),
        })
        .select("*")
        .single();

      if (insErr) {
        return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
      }

      // Send push notification & email to tutor
      try {
        const { sendPushNotification } = await import("@/lib/notifications/web-push");
        await sendPushNotification(tutorId, {
          title: "New Message from Parent",
          body: content.trim(),
          url: `/dashboard/messages?parentEmail=${encodeURIComponent(parentEmail)}`,
        });

        // Email notification to tutor
        const { data: tutorUser } = await admin.auth.admin.getUserById(tutorId);
        const tutorEmail = tutorUser?.user?.email;
        if (tutorEmail) {
          const { sendNewMessageEmail } = await import("@/lib/notifications/booking-update");
          const { PUBLIC_SITE_URL } = await import("@/lib/constants");
          await sendNewMessageEmail({
            to: tutorEmail,
            senderName: "Parent / Student",
            messageContent: content.trim(),
            actionUrl: `${PUBLIC_SITE_URL}/dashboard/messages?parentEmail=${encodeURIComponent(parentEmail)}`,
          });
        }
      } catch (pushErr) {
        console.error("Failed to send notification to tutor:", pushErr);
      }

      return NextResponse.json({ ok: true, message });
    }

    // 2. Logged-in user context
    const user = await safeGetAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const tutor = await getTutorProfileForUser(user.id);
    if (tutor) {
      if (!parentEmailParam?.trim()) {
      return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });
    }

    const parentEmail = parentEmailParam.trim().toLowerCase();

    // Insert message
    const { data: message, error: insErr } = await admin
      .from("messages")
      .insert({
        tutor_id: tutor.id,
        parent_email: parentEmail,
        sender: "tutor",
        content: content.trim(),
      })
      .select("*")
      .single();

    if (insErr) {
      return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
    }

    // Send push notification & email to parent
    try {
      const { data: usersData } = await admin.auth.admin.listUsers();
      const parentUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === parentEmail
      );
      if (parentUser?.id) {
        const { sendPushNotification } = await import("@/lib/notifications/web-push");
        await sendPushNotification(parentUser.id, {
          title: `New Message from ${tutor.displayName || "your Tutor"}`,
          body: content.trim(),
          url: `/tutor/${tutor.username}/workspace?tab=chat`,
        });
      }

      // Email notification to parent
      const { sendNewMessageEmail } = await import("@/lib/notifications/booking-update");
      const { PUBLIC_SITE_URL } = await import("@/lib/constants");
      await sendNewMessageEmail({
        to: parentEmail,
        senderName: tutor.displayName || "Tutor",
        messageContent: content.trim(),
        actionUrl: `${PUBLIC_SITE_URL}/tutor/${tutor.username}/workspace?tab=chat`,
      });
    } catch (pushErr) {
      console.error("Failed to send notification to parent:", pushErr);
    }

    return NextResponse.json({ ok: true, message });
    } else {
      // Parent sending message (using logged-in user email)
      const { tutorId } = body;
      if (!tutorId) {
        return NextResponse.json({ error: "Tutor ID is required." }, { status: 400 });
      }

      // Verify parent is connected with the tutor
      const { data: student } = await admin
        .from("students")
        .select("id")
        .eq("tutor_id", tutorId)
        .eq("parent_email", user.email)
        .eq("status", "active")
        .maybeSingle();

      if (!student) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
      }

      // Insert message
      const { data: message, error: insErr } = await admin
        .from("messages")
        .insert({
          tutor_id: tutorId,
          parent_email: user.email,
          sender: "parent",
          content: content.trim(),
        })
        .select("*")
        .single();

      if (insErr) {
        return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
      }

      // Send push notification & email to tutor
      try {
        const { sendPushNotification } = await import("@/lib/notifications/web-push");
        await sendPushNotification(tutorId, {
          title: "New Message from Parent",
          body: content.trim(),
          url: `/dashboard/messages?parentEmail=${encodeURIComponent(user.email!)}`,
        });

        // Email notification to tutor
        const { data: tutorUser } = await admin.auth.admin.getUserById(tutorId);
        const tutorEmail = tutorUser?.user?.email;
        if (tutorEmail) {
          const { sendNewMessageEmail } = await import("@/lib/notifications/booking-update");
          const { PUBLIC_SITE_URL } = await import("@/lib/constants");
          await sendNewMessageEmail({
            to: tutorEmail,
            senderName: user.email || "Parent / Student",
            messageContent: content.trim(),
            actionUrl: `${PUBLIC_SITE_URL}/dashboard/messages?parentEmail=${encodeURIComponent(user.email!)}`,
          });
        }
      } catch (pushErr) {
        console.error("Failed to send notification to tutor:", pushErr);
      }

      return NextResponse.json({ ok: true, message });
    }
  } catch (error) {
    console.error("Messages endpoint POST error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
