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
  const themeColor = "#446152"; 
  const backgroundColor = "#fbfbf8";

  // Use tutor's avatar as the icon, falling back to Yazzow logo
  const iconUrl = tutor.avatarUrl || "/icon.png";

  const manifest = {
    name,
    short_name: shortName,
    description,
    start_url: `/tutor/${tutor.username}`,
    display: "standalone",
    background_color: backgroundColor,
    theme_color: themeColor,
    orientation: "portrait-primary",
    scope: `/tutor/${tutor.username}`,
    icons: [
      {
        src: iconUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
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
