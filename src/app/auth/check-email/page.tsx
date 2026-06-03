import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
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
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/60 px-4 py-4 sm:px-6">
        <Logo size="header" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="mx-auto w-full max-w-md border-border/80">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Check your inbox</CardTitle>
            <CardDescription>
              We sent a confirmation link. Click it to finish setting up your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" render={<Link href="/auth/login" />}>
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
