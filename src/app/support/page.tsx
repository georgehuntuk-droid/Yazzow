import { MarketingShell } from "@/components/layout/marketing-shell";
import { SupportContainer } from "@/components/support/support-container";
import { BRAND_NAME } from "@/lib/constants";
import { safeGetAuthUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: `Support · ${BRAND_NAME}`,
  description: `Get in touch with the ${BRAND_NAME} support team. Submit a support ticket for billing, account setup, or general assistance.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SupportPage() {
  const user = await safeGetAuthUser();
  let initialUser = null;
  if (user && user.email) {
    let name = user.user_metadata?.display_name || user.user_metadata?.full_name;
    if (!name) {
      try {
        const admin = createAdminClient();
        const { data: profile } = await admin
          .from("tutor_profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.display_name) {
          name = profile.display_name;
        } else {
          // Query students table for pupil/parent account name
          const { data: student } = await admin
            .from("students")
            .select("student_name")
            .ilike("parent_email", user.email)
            .limit(1);
          if (student && student.length > 0) {
            name = student[0].student_name;
          }
        }
      } catch (err) {
        console.error("Error fetching profile for support page:", err);
      }
    }
    initialUser = {
      email: user.email,
      name: name || user.email.split("@")[0] || "User",
    };
  }

  return (
    <MarketingShell>
      <div className="yazz-container flex-1 py-16 sm:py-20">
        <SupportContainer initialUser={initialUser} />
      </div>
    </MarketingShell>
  );
}
