import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeGetAuthUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const resourceId = searchParams.get("resourceId");
  const workspace = searchParams.get("workspace") === "true";

  const admin = createAdminClient();
  let filePath: string | null = null;
  let title: string | null = null;

  // Scenario 1: Download via Purchase Token
  if (token) {
    const { data: purchase, error: purchaseErr } = await admin
      .from("resource_purchases")
      .select("resource_id")
      .eq("download_token", token)
      .maybeSingle();

    if (purchaseErr || !purchase) {
      return new Response("Invalid or expired download link.", { status: 404 });
    }

    const { data: resource, error: resourceErr } = await admin
      .from("digital_resources")
      .select("title, file_path")
      .eq("id", purchase.resource_id)
      .maybeSingle();

    if (resourceErr || !resource) {
      return new Response("Resource file not found.", { status: 404 });
    }

    filePath = resource.file_path;
    title = resource.title;
  }
  // Scenario 2: Direct download for Workspace students
  else if (resourceId && workspace) {
    const user = await safeGetAuthUser();
    if (!user || !user.email) {
      return new Response("Unauthorized. Please log in.", { status: 401 });
    }

    const { data: resource, error: resourceErr } = await admin
      .from("digital_resources")
      .select("title, file_path, tutor_id")
      .eq("id", resourceId)
      .maybeSingle();

    if (resourceErr || !resource) {
      return new Response("Resource not found.", { status: 404 });
    }

    // Verify student is connected to this tutor
    const { data: studentConnection } = await admin
      .from("students")
      .select("id")
      .eq("tutor_id", resource.tutor_id)
      .ilike("parent_email", user.email)
      .eq("status", "active")
      .maybeSingle();

    if (!studentConnection) {
      return new Response("Access denied. You are not connected to this tutor.", { status: 403 });
    }

    filePath = resource.file_path;
    title = resource.title;
  }
  // Scenario 3: Free Resource Download
  else if (resourceId) {
    const { data: resource, error: resourceErr } = await admin
      .from("digital_resources")
      .select("title, file_path, price_cents")
      .eq("id", resourceId)
      .maybeSingle();

    if (resourceErr || !resource) {
      return new Response("Resource not found.", { status: 404 });
    }

    if (resource.price_cents > 0) {
      return new Response("This resource is not free.", { status: 403 });
    }

    filePath = resource.file_path;
    title = resource.title;
  } else {
    return new Response("Missing download parameters.", { status: 400 });
  }

  if (!filePath || !title) {
    return new Response("Missing resource file path or title.", { status: 400 });
  }

  // 3. Download and stream the file from Supabase Storage
  const { data: fileBlob, error: downloadErr } = await admin.storage
    .from("worksheets")
    .download(filePath);

  if (downloadErr || !fileBlob) {
    return new Response("Failed to download file from storage.", { status: 500 });
  }

  const buffer = Buffer.from(await fileBlob.arrayBuffer());
  const ext = filePath.endsWith(".docx") ? "docx" : "pdf";
  const contentType = ext === "docx"
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : "application/pdf";

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(title)}.${ext}"`,
    },
  });
}
