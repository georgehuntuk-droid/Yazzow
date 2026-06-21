import { Metadata } from "next";
import { BRAND_NAME, PUBLIC_SITE_URL } from "@/lib/constants";

export async function robots(): Promise<Metadata["robots"] | any> {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/tools/invoice-generator",
          "/tools/rate-calculator",
        ],
        disallow: [
          "/support",
          "/privacy-policy",
          "/terms-and-conditions",
          "/refund-policy",
          "/tutor",
          "/tutor/*", // Block indexing all public tutor portals
          "/dashboard", // Block private dashboards
          "/dashboard/*",
          "/auth", // Block authentication routes
          "/auth/*",
          "/booking/manage/*", // Block parent-specific booking manage routes
          "/tutor/*/workspace", // Block parent student workspace
          "/tutor/*/workspace/*",
          "/onboarding", // Block onboarding routes
          "/onboarding/*",
          "/admin", // Block admin routes
          "/admin/*",
          "/api/*", // Block all background API endpoints
        ],
      },
    ],
    sitemap: `${PUBLIC_SITE_URL}/sitemap.xml`,
  };
}


export default robots;
