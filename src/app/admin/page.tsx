import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/constants";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ExternalLink, Key, Settings } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminKey } from "@/lib/supabase/admin-key";
import { getPlatformRevenueStats } from "@/lib/platform/revenue";
import { AdminConsoleClient, AdminTutorData } from "@/components/dashboard/admin-console-client";
import { PlatformRevenuePanel } from "@/components/dashboard/platform-revenue-panel";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: `Admin Console · ${BRAND_NAME}`,
  robots: { index: false, follow: false },
};

export const revalidate = 0; // Disable server caching for live admin console data

export default async function AdminDashboardPage() {
  // 1. Guard against non-admin access
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  // 2. Check if the Supabase Service Role Key is configured
  const serviceRoleConfigured = hasSupabaseAdminKey();

  if (!serviceRoleConfigured) {
    return (
      <main className="flex-1 p-6 lg:p-10 flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-2xl space-y-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>

          <Card className="yazz-surface border-amber-500/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            
            <CardHeader className="space-y-2 pb-4 pt-6 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner animate-bounce">
                <AlertTriangle className="size-6" />
              </div>
              <CardTitle className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Service Role Key Required
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto">
                The Platform Admin Console requires your Supabase secret service_role key to bypass Row Level Security (RLS) and query platform statistics.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-8 space-y-6">
              <div className="rounded-xl bg-muted/40 border border-border/60 p-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Settings className="size-4 text-primary" />
                  How to configure your live site:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-xs">
                  <li>
                    Log in to your <strong>Supabase Dashboard</strong> at{" "}
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">
                      supabase.com <ExternalLink className="size-3" />
                    </a>.
                  </li>
                  <li>
                    Go to <strong>Project Settings</strong> ➔ <strong>API</strong>.
                  </li>
                  <li>
                    Find the <strong>`service_role` secret key</strong> (starts with `eyJ...` or `sb_secret_...`). Copy it.
                  </li>
                  <li>
                    Log in to <strong>Vercel</strong>, select your project, and go to <strong>Settings</strong> ➔ <strong>Environment Variables</strong>.
                  </li>
                  <li>
                    Add a new variable named <code className="font-mono bg-muted-foreground/15 px-1 rounded text-foreground font-bold">SUPABASE_SECRET_KEY</code> and paste the value.
                  </li>
                  <li>
                    Redeploy the project in Vercel for the changes to take effect.
                  </li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl h-11 px-6 inline-flex items-center gap-1.5"
                  )}
                >
                  Open Supabase Dashboard
                  <ExternalLink className="size-4" />
                </a>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "rounded-xl h-11 px-6 border-border/85 font-semibold"
                  )}
                >
                  Return to Dashboard
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const admin = createAdminClient();

  // 3. Fetch all raw data in parallel using service role
  const [profilesRes, usersRes, stats, bookingsRes, purchasesRes, ticketsRes, noticesRes, studentsRes, bannedUsersRes] = await Promise.all([
    admin.from("tutor_profiles").select("*").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers(),
    getPlatformRevenueStats(),
    admin.from("bookings").select("tutor_id, amount_cents, status, availability_slots (starts_at)"),
    admin.from("resource_purchases").select("tutor_id, amount_cents"),
    admin.from("support_tickets").select("*").order("created_at", { ascending: false }),
    admin.from("admin_notices").select("*").order("created_at", { ascending: false }),
    admin.from("students").select("parent_email, student_name"),
    admin.from("banned_users").select("email"),
  ]);

  if (profilesRes.error) {
    throw new Error(`Database error fetching profiles: ${profilesRes.error.message}`);
  }

  const rawProfiles = profilesRes.data ?? [];
  const authUsers = usersRes.data?.users ?? [];
  const rawBookings = bookingsRes.data ?? [];
  const rawPurchases = purchasesRes.data ?? [];
  const rawTickets = ticketsRes?.error ? [] : (ticketsRes?.data ?? []);
  const rawNotices = noticesRes?.error ? [] : (noticesRes?.data ?? []);
  const rawStudents = studentsRes?.error ? [] : (studentsRes?.data ?? []);
  const rawBanned = bannedUsersRes?.error ? [] : (bannedUsersRes?.data ?? []);

  const studentsList = rawStudents.map((s) => ({
    parentEmail: s.parent_email,
    studentName: s.student_name,
  }));

  const studentEmails = new Set(rawStudents.map((s) => s.parent_email?.toLowerCase()).filter(Boolean));
  const bannedEmails = new Set(rawBanned.map((b) => b.email?.toLowerCase()).filter(Boolean));

  const pendingOnboardingUsers = authUsers.filter((u) => {
    const email = u.email?.toLowerCase();
    if (!email) return false;
    const hasProfile = rawProfiles.some((p) => p.id === u.id);
    const isStudent = studentEmails.has(email);
    return !hasProfile && !isStudent;
  }).map((u) => ({
    id: u.id,
    email: u.email || "No email",
    createdAt: u.created_at,
    name: u.user_metadata?.display_name || u.user_metadata?.full_name || "New SignUp",
    isBanned: bannedEmails.has(u.email?.toLowerCase() || ""),
  }));

  // Group student records by parent_email
  const parentStudentsMap = new Map<string, string[]>();
  for (const s of rawStudents) {
    if (!s.parent_email) continue;
    const emailLower = s.parent_email.toLowerCase();
    const current = parentStudentsMap.get(emailLower) ?? [];
    if (!current.includes(s.student_name)) {
      current.push(s.student_name);
    }
    parentStudentsMap.set(emailLower, current);
  }

  // Cross-reference with auth users
  const studentAccounts = Array.from(parentStudentsMap.entries()).map(([email, studentNames]) => {
    const authUser = authUsers.find((u) => u.email?.toLowerCase() === email);
    return {
      email,
      studentNames,
      id: authUser?.id || null,
      createdAt: authUser?.created_at || null,
      isBanned: bannedEmails.has(email),
    };
  });

  // Create helper structures for fast lookups
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));
  
  // Fetch Stripe Connect status in parallel for active tutors to verify onboarding completion
  const stripeStatusList = await Promise.all(
    rawProfiles.map(async (p) => {
      if (!p.stripe_account_id) return { id: p.id, ready: false };
      try {
        const { getConnectStatus } = await import("@/lib/stripe/connect");
        const status = await getConnectStatus(p.stripe_account_id);
        return { id: p.id, ready: status.ready };
      } catch {
        return { id: p.id, ready: false };
      }
    })
  );
  const stripeStatusMap = new Map(stripeStatusList.map((s) => [s.id, s.ready]));

  // Calculate bookings stats per tutor (Total and This Month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const bookingsMap = new Map<string, { count: number; volume: number; countThisMonth: number }>();
  for (const b of rawBookings) {
    if (b.status !== "confirmed") continue;
    const current = bookingsMap.get(b.tutor_id) ?? { count: 0, volume: 0, countThisMonth: 0 };
    
    // Check if slot was scheduled for this month
    const slot = Array.isArray(b.availability_slots) ? b.availability_slots[0] : b.availability_slots;
    const startsAt = (slot as any)?.starts_at;
    const isThisMonth = startsAt && new Date(startsAt) >= startOfMonth;

    bookingsMap.set(b.tutor_id, {
      count: current.count + 1,
      volume: current.volume + (b.amount_cents ?? 0),
      countThisMonth: current.countThisMonth + (isThisMonth ? 1 : 0),
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
    const bStats = bookingsMap.get(p.id) ?? { count: 0, volume: 0, countThisMonth: 0 };
    const pStats = purchasesMap.get(p.id) ?? { count: 0, volume: 0 };
    const authUser = authUsers.find((u) => u.id === p.id);

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
      subscriptionTier: p.subscription_tier || "starter",
      createdAt: p.created_at,
      lessonCount: bStats.count,
      lessonVolumeCents: bStats.volume,
      resourceCount: pStats.count,
      resourceVolumeCents: pStats.volume,
      paymentInstructions: p.payment_instructions,
      isBanned: p.is_banned === true,
      stripeCustomerId: p.stripe_customer_id,
      // Operational command center fields
      lastLogin: authUser?.last_sign_in_at || null,
      lessonsScheduledThisMonth: bStats.countThisMonth,
      isStripeCompleted: stripeStatusMap.get(p.id) === true,
      isCalendarActive: !!(p as any).google_refresh_token || !!(p as any).calendar_feed_token,
      smsSentCount: (p as any).sms_sent_count || 0,
      googleConnected: !!(p as any).google_refresh_token,
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

          <AdminConsoleClient 
            tutors={tutors} 
            platformStats={stats} 
            isServiceRoleConfigured={serviceRoleConfigured}
            supportTickets={rawTickets}
            notices={rawNotices}
            studentsList={studentsList}
            pendingOnboardingUsers={pendingOnboardingUsers}
            studentAccounts={studentAccounts}
          />
        </div>

      </div>
    </main>
  );
}
