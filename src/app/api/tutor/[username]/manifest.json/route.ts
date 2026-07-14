import { NextResponse } from "next/server";

import { getTutorByUsername } from "@/lib/tutors/queries";
import { getDemoTutorByUsername } from "@/lib/demo-data";

type RouteContext = {
  params: Promise<{ username: string }>;
};

const DEMO_USERNAMES = new Set(["demo", "maya-chen"]);

export async function GET(_request: Request, context: RouteContext) {
  const { username } = await context.params;

  const isDemo = DEMO_USERNAMES.has(username);
  const tutor = isDemo
    ? getDemoTutorByUsername(username)
    : await getTutorByUsername(username);

  if (!tutor) {
    return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
  }

  const name = `${tutor.displayName} Portal`;
  const shortName = tutor.displayName;
  const description = tutor.headline
    ? `${tutor.headline} - private student portal`
    : `Private booking portal and workspace for ${tutor.displayName}`;

  // Default color fallback
  const themeColor = "#0072d5"; 
  const backgroundColor = "#000000";

  // Use tutor's avatar as the icon, falling back to Yazzow logo
  const iconUrl = tutor.avatarUrl || "/icon.png?v=4";

  const host = _request.headers.get("host") || "yazzow.com";
  // Check if secure connection, fallback to http on localhost/dev
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const manifestUrl = `${protocol}://${host}/api/tutor/${tutor.username}/manifest.json`;

  const manifest = {
    name,
    short_name: shortName,
    description,
    start_url: `/tutor/${tutor.username}`,
    display: "standalone",
    background_color: backgroundColor,
    theme_color: themeColor,
    color_scheme: "light",
    orientation: "portrait-primary",
    scope: `/tutor/${tutor.username}`,
    icons: [
      {
        src: iconUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: iconUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      }
    ],
    prefer_related_applications: true,
    related_applications: [
      {
        platform: "webapp",
        url: manifestUrl
      }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, must-revalidate"
    }
  });
}
