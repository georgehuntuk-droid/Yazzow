import type { Metadata } from "next";
import { DemoGuideClient } from "./demo-guide-client";
import { BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Tutor Guide & Playground · ${BRAND_NAME}`,
  robots: { index: false, follow: false },
};

export default function DemoGuidePage() {
  return <DemoGuideClient />;
}
