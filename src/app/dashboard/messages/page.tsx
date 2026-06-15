import { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { TutorMessagesClient } from "@/components/dashboard/tutor-messages-client";
import { requireTutorProfile } from "@/lib/auth/session";
import { BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Messages · ${BRAND_NAME}`,
};

export default async function TutorMessagesPage() {
  const { profile } = await requireTutorProfile();

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      <div className="px-6 py-6 border-b border-border/40 shrink-0">
        <h1 className="font-heading text-2xl font-black tracking-tight text-foreground">
          Messages
        </h1>
        <p className="text-xs font-semibold text-muted-foreground mt-1">
          Chat with parents and students directly on Yazzow.
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-background/30">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm gap-2">
              <Loader2 className="size-5 animate-spin text-primary" />
              Loading messages...
            </div>
          }
        >
          <TutorMessagesClient tutorId={profile.id} />
        </Suspense>
      </div>
    </div>
  );
}
