import Link from "next/link";
import { notFound } from "next/navigation";

import { ManageBookingPanel } from "@/components/booking/manage-booking-panel";
import { ParentChatPanel } from "@/components/booking/parent-chat-panel";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/constants";
import { getBookingForManage } from "@/lib/bookings/booking-manage";

export const metadata = {
  title: `Manage booking · ${BRAND_NAME}`,
};

type ManageBookingPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ManageBookingPage({ params }: ManageBookingPageProps) {
  const { token } = await params;
  const booking = await getBookingForManage(token);

  if (!booking) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60">
        <div className="yazz-container flex h-16 max-w-4xl items-center justify-between">
          <Logo size="header" href="/" />
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Home
          </Link>
        </div>
      </header>
      <main className="yazz-container flex-1 max-w-4xl py-10">
        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] items-start">
          <ManageBookingPanel booking={booking} />
          <ParentChatPanel token={token} tutorDisplayName={booking.tutorDisplayName} />
        </div>
      </main>
    </div>
  );
}
