import { MetadataRoute } from "next";
import { PUBLIC_SITE_URL } from "@/lib/constants";

export const revalidate = 3600; // Cache sitemap for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only the static platform homepage is allowed for indexation
  return [
    {
      url: PUBLIC_SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
  ];
}

