import { NextResponse } from "next/server";
import { verifyBookingManageToken } from "@/lib/bookings/manage-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeGetAuthUser } from "@/lib/supabase/server";
import { getTutorProfileForUser } from "@/lib/tutors/queries";
import { getPublicStorageUrl } from "@/lib/supabase/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const token = formData.get("token") as string | null;
    const parentEmail = formData.get("parentEmail") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Ensure 'attachments' bucket exists programmatically
    try {
      const { data: buckets } = await admin.storage.listBuckets();
      const exists = buckets?.some((b) => b.id === "attachments");
      if (!exists) {
        await admin.storage.createBucket("attachments", {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
          ],
        });
      }
    } catch (err) {
      console.warn("Could not auto-create attachments bucket:", err);
    }

    let tutorId: string | null = null;
    let folderName: string = "anon";

    // 1. Verify Parent via Token
    if (token) {
      const bookingId = verifyBookingManageToken(token);
      if (!bookingId) {
        return NextResponse.json({ error: "Invalid token." }, { status: 401 });
      }
      const { data: booking } = await admin
        .from("bookings")
        .select("tutor_id")
        .eq("id", bookingId)
        .maybeSingle();

      if (!booking) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }
      tutorId = booking.tutor_id;
      folderName = `parent-${tutorId}`;
    } else {
      // 2. Verify Auth (Tutor or Parent)
      const user = await safeGetAuthUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      
      const tutor = await getTutorProfileForUser(user.id);
      if (tutor) {
        if (tutor.isBanned) {
          return NextResponse.json({ error: "Forbidden: Account is suspended." }, { status: 403 });
        }
        tutorId = tutor.id;
        folderName = `tutor-${tutorId}`;
      } else {
        // Logged-in parent user
        folderName = `parent-user`;
      }
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize and create safe storage name
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${folderName}/${timestamp}_${cleanFileName}`;

    // Upload to Supabase Storage using admin client
    const { error: uploadError } = await admin.storage
      .from("attachments")
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const publicUrl = getPublicStorageUrl("attachments", storagePath);

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      name: file.name,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Server error during file upload." }, { status: 500 });
  }
}
