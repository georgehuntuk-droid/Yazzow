import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PortalThemeWrapper } from "@/components/tutor/portal-theme-wrapper";
import { StudentGuideClient } from "./student-guide-client";
import { getTutorByUsername } from "@/lib/tutors/queries";
import { getDemoTutorByUsername } from "@/lib/demo-data";
import { BRAND_NAME } from "@/lib/constants";

type GuidePageProps = {
  params: Promise<{ username: string }>;
};

const DEMO_USERNAMES = new Set(["demo", "maya-chen"]);

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { username } = await params;
  const isDemo = DEMO_USERNAMES.has(username);
  const tutor = isDemo ? getDemoTutorByUsername(username) : await getTutorByUsername(username);

  return {
    title: tutor ? `Student Guide · ${tutor.displayName} · ${BRAND_NAME}` : `Student Guide · ${BRAND_NAME}`,
    robots: { index: false, follow: false },
  };
}

export default async function StudentGuidePage({ params }: GuidePageProps) {
  const { username } = await params;
  
  const isDemo = DEMO_USERNAMES.has(username);
  const tutor = isDemo ? getDemoTutorByUsername(username) : await getTutorByUsername(username);

  if (!tutor) {
    notFound();
  }

  return (
    <PortalThemeWrapper tutor={tutor}>
      <div className="min-h-screen bg-background flex flex-col">
        <StudentGuideClient 
          tutorUsername={username} 
          tutorDisplayName={tutor.displayName} 
        />
      </div>
    </PortalThemeWrapper>
  );
}
