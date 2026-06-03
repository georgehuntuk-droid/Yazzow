import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = {
  title: `Check your email · ${BRAND_NAME}`,
};

export default function CheckEmailPage() {
  return (
    <AuthShell
      title="Almost there"
      subtitle="Confirm your email to finish creating your Yazzow account and claim your portal link."
    >
      <Card className="yazz-surface w-full border-border/80">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Check your inbox</CardTitle>
          <CardDescription>
            We sent a confirmation link. Click it to finish setting up your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/auth/login"
            className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
