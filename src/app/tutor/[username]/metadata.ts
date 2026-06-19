import type { Metadata, ResolvingMetadata } from "next";
import { getTutorByUsername } from "@/lib/tutors/queries";
import { getDemoTutorByUsername } from "@/lib/demo-data";
import { BRAND_NAME, PUBLIC_SITE_URL } from "@/lib/constants";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { username } = await params;
  
  const isDemo = username === "demo" || username === "maya-chen";
  const tutor = isDemo 
    ? getDemoTutorByUsername(username)
    : await getTutorByUsername(username);

  if (!tutor) {
    return {
      title: `Tutor Not Found · ${BRAND_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  const title = `${tutor.displayName} · Private Tutor Booking Page`;
  const description = tutor.headline 
    ? `${tutor.headline}. Book 1-on-1 online lessons, purchase premium worksheets, and manage slots directly.`
    : `Book 1-on-1 online lessons, purchase premium worksheets, and view slot availability directly on ${tutor.displayName}'s private booking portal.`;

  const siteUrl = `${PUBLIC_SITE_URL}/tutor/${tutor.username}`;
  const avatarImage = tutor.avatarUrl || `${PUBLIC_SITE_URL}/icon.png`;

  return {
    title,
    description,
    manifest: `/api/tutor/${tutor.username}/manifest.json`,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: BRAND_NAME,
      images: [
        {
          url: avatarImage,
          width: 800,
          height: 800,
          alt: `${tutor.displayName} Profile Picture`,
        },
      ],
      type: "profile",
      firstName: tutor.displayName.split(" ")[0] || tutor.displayName,
      lastName: tutor.displayName.split(" ").slice(1).join(" ") || undefined,
      username: tutor.username,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [avatarImage],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}
