import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PUBLIC_SITE_URL } from "@/lib/constants";

export const revalidate = 3600; // Cache sitemap for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static platform marketing routes
  const routes = [
    {
      url: PUBLIC_SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${PUBLIC_SITE_URL}/support`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: `${PUBLIC_SITE_URL}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${PUBLIC_SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${PUBLIC_SITE_URL}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];

  // 2. Fetch all public tutor usernames from Database in dynamic manner
  try {
    const admin = createAdminClient();
    const { data: profiles, error } = await admin
      .from("tutor_profiles")
      .select("username, updated_at")
      .order("updated_at", { ascending: false });

    if (!error && profiles) {
      const tutorRoutes = profiles.map((tutor) => ({
        url: `${PUBLIC_SITE_URL}/tutor/${tutor.username}`,
        lastModified: tutor.updated_at ? new Date(tutor.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
      routes.push(...tutorRoutes);
    }
  } catch (err) {
    console.warn("Gracefully skipping dynamic sitemap profiles generation during build/missing keys:", err instanceof Error ? err.message : err);
  }

  return routes;
}
