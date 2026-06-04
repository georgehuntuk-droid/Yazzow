import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformRevenueStats } from "@/lib/platform/revenue";
import { AdminConsoleClient, AdminTutorData } from "@/components/dashboard/admin-console-client";
import { PlatformRevenuePanel } from "@/components/dashboard/platform-revenue-panel";
import { Separator } from "@/components/ui/separator";

export const revalidate = 0; // Disable server caching for live admin console data

export default async function AdminDashboardPage() {
  // 1. Guard against non-admin access
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();

  // 2. Fetch all raw data in parallel using service role
  const [profilesRes, usersRes, stats, bookingsRes, purchasesRes] = await Promise.all([
    admin.from("tutor_profiles").select("*").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers(),
    getPlatformRevenueStats(),
    admin.from("bookings").select("tutor_id, amount_cents, status"),
    admin.from("resource_purchases").select("tutor_id, amount_cents")
  ]);

  if (profilesRes.error) {
    throw new Error(`Database error fetching profiles: ${profilesRes.error.message}`);
  }

  const rawProfiles = profilesRes.data ?? [];
  const authUsers = usersRes.data?.users ?? [];
  const rawBookings = bookingsRes.data ?? [];
  const rawPurchases = purchasesRes.data ?? [];

  // Create helper structures for fast lookups
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));
  
  // Calculate bookings stats per tutor
  const bookingsMap = new Map<string, { count: number; volume: number }>();
  for (const b of rawBookings) {
    if (b.status !== "confirmed") continue;
    const current = bookingsMap.get(b.tutor_id) ?? { count: 0, volume: 0 };
    bookingsMap.set(b.tutor_id, {
      count: current.count + 1,
      volume: current.volume + (b.amount_cents ?? 0),
    });
  }

  // Calculate purchases stats per tutor
  const purchasesMap = new Map<string, { count: number; volume: number }>();
  for (const p of rawPurchases) {
    const current = purchasesMap.get(p.tutor_id) ?? { count: 0, volume: 0 };
    purchasesMap.set(p.tutor_id, {
      count: current.count + 1,
      volume: current.volume + (p.amount_cents ?? 0),
    });
  }

  // Merge everything into the AdminTutorData structure
  const tutors: AdminTutorData[] = rawProfiles.map((p) => {
    const bStats = bookingsMap.get(p.id) ?? { count: 0, volume: 0 };
    const pStats = purchasesMap.get(p.id) ?? { count: 0, volume: 0 };

    return {
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      email: emailMap.get(p.id) ?? "no-email@yazzow.com",
      avatarUrl: p.avatar_url,
      lessonPriceCents: p.lesson_price_cents,
      currency: p.currency,
      stripeAccountId: p.stripe_account_id,
      subscriptionStatus: p.subscription_status,
      subscriptionCurrentPeriodEnd: p.subscription_current_period_end,
      createdAt: p.created_at,
      lessonCount: bStats.count,
      lessonVolumeCents: bStats.volume,
      resourceCount: pStats.count,
      resourceVolumeCents: pStats.volume,
    };
  });

  return (
    <main className="flex-1 p-6 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Platform Admin Console
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Manage registered tutors, view platform revenue statistics, grant/comp subscription flags, and audit accounts.
          </p>
        </div>

        {/* Platform Revenue Stats Dashboard */}
        <PlatformRevenuePanel stats={stats} />

        <Separator className="bg-border/60" />

        {/* Tutors Table list and search */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Tutor Directory
            </h2>
            <p className="text-sm text-muted-foreground">
              A list of all users who have completed tutor onboarding on Yazzow.
            </p>
          </div>

          <AdminConsoleClient tutors={tutors} platformStats={stats} />
        </div>
      </div>
    </main>
  );
}
