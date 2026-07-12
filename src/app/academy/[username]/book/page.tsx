import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTutorByUsername } from "@/lib/tutors/queries";
import { AcademyBookingForm } from "./academy-booking-form";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function AcademyBookPage({ params }: PageProps) {
  const { username } = await params;
  const academy = await getTutorByUsername(username);
  if (!academy || (academy.role !== "academy_owner" && !academy.isPlatformAdmin)) {
    notFound();
  }

  const admin = createAdminClient();
  // Fetch all staff tutors including the owner
  const { data: staff } = await admin
    .from("tutor_profiles")
    .select("id, display_name, avatar_url, headline, username, lesson_price_cents")
    .or(`parent_academy_id.eq.${academy.id},academy_id.eq.${academy.id},id.eq.${academy.id}`);

  const tutors = staff || [];
  const tutorIds = tutors.map((t) => t.id);

  // Fetch all unbooked upcoming slots
  const { data: rawSlots } = await admin
    .from("availability_slots")
    .select("id, starts_at, ends_at, tutor_id")
    .in("tutor_id", tutorIds)
    .eq("is_booked", false)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  const slots = rawSlots || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="yazz-container flex h-16 max-w-5xl items-center justify-between gap-4">
          <Logo size="header" href="/" businessLogoUrl={academy.businessLogoUrl} businessName={academy.businessName} />
          <Link href={`/tutor/${username}`} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Back to Portal
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="size-3" /> Smart Academy Routing
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Centralized Booking Portal</h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Select your target subject and time. Our system will automatically match you with the best available tutor from the <strong>{academy.businessName || academy.displayName}</strong> team.
          </p>
        </div>

        <AcademyBookingForm academy={academy} tutors={tutors} slots={slots} />
      </main>
    </div>
  );
}
