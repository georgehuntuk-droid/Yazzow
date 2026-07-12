import { NextResponse } from "next/server";

import { LESSON_SLOT_DURATION_MINUTES, PUBLIC_SITE_URL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TutorProfileRow } from "@/lib/supabase/database.types";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { getTutorSubscriptionState } from "@/lib/stripe/subscription";

type PackageCheckoutBody = {
  tutorUsername: string;
  parentEmail: string;
  parentPhone?: string;
  studentName?: string;
  packageId?: string;
  subscribeToAlerts?: boolean;
};

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments not configured yet." }, { status: 503 });
  }

  const body = (await request.json()) as PackageCheckoutBody;
  const { tutorUsername, parentEmail, parentPhone, studentName, packageId, subscribeToAlerts } = body;

  if (!tutorUsername || !parentEmail) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { isUserBanned } = await import("@/lib/auth/ban-check");
  if (await isUserBanned(parentEmail)) {
    return NextResponse.json({ error: "This email is suspended from making bookings." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: tutorData } = await admin
    .from("tutor_profiles")
    .select("*")
    .eq("username", tutorUsername)
    .maybeSingle();

  const tutor = tutorData as any | null;

  if (!tutor?.stripe_account_id) {
    return NextResponse.json(
      { error: "This tutor has not connected payouts yet. Try again later." },
      { status: 400 },
    );
  }

  const subscription = await getTutorSubscriptionState(tutor.id);
  if (!subscription.active) {
    return NextResponse.json(
      { error: "This tutor's booking portal is not active right now." },
      { status: 403 },
    );
  }

  // Check if tutor active student limit is reached
  const { checkStudentLimitBeforeBooking } = await import("@/lib/bookings/limits");
  const limitCheck = await checkStudentLimitBeforeBooking({
    tutorId: tutor.id,
    parentEmail,
    studentName,
  });
  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 403 });
  }

  let lessonsCount = tutor.block_package_lessons_count ?? 10;
  let amountCents = 0;
  let packageName = `${lessonsCount}x Lesson Credits Package`;
  let description = `Bulk block booking package · Includes ${lessonsCount} lesson credits to book on this page anytime.`;

  if (packageId) {
    const { data: pkg } = await admin
      .from("tutor_packages")
      .select("*")
      .eq("id", packageId)
      .eq("tutor_id", tutor.id)
      .maybeSingle();

    if (!pkg) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    lessonsCount = pkg.lessons_count;
    amountCents = pkg.price_cents;
    packageName = pkg.name;
    description = `Lesson Bundle: ${pkg.name} · Includes ${pkg.lessons_count} lesson credits to book on this page anytime.`;
  } else {
    const discountPercent = tutor.block_package_discount_percent ?? 10;
    const discountMultiplier = 1 - discountPercent / 100;
    amountCents = Math.round(tutor.lesson_price_cents * lessonsCount * discountMultiplier);
    packageName = `${lessonsCount}x Lesson Credits Package with ${tutor.display_name}`;
    description = `Bulk block booking package · Includes ${lessonsCount} lesson credits to book on this page anytime. (${discountPercent}% savings!)`;
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: parentEmail,
      line_items: [
        {
          price_data: {
            currency: tutor.currency,
            unit_amount: amountCents,
            product_data: {
              name: packageName,
              description,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "package",
        tutor_id: tutor.id,
        parent_email: parentEmail,
        parent_phone: parentPhone ?? "",
        student_name: studentName ?? "",
        lessons_count: String(lessonsCount),
        discount_percent: "0",
        platform_fee_cents: "0",
        subscribe_to_alerts: String(subscribeToAlerts !== false),
      },
      success_url: `${PUBLIC_SITE_URL}/tutor/${tutorUsername}?package_booked=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PUBLIC_SITE_URL}/tutor/${tutorUsername}?cancelled=1`,
    },
    { stripeAccount: tutor.stripe_account_id },
  );

  return NextResponse.json({ url: session.url });
}
