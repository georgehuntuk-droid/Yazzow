import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/constants";

export default function TutorNotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading text-2xl font-semibold">This tutor page isn&apos;t here yet</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        We couldn&apos;t find a tutor at this link. Ask your tutor for their direct{" "}
        {BRAND_NAME} URL.
      </p>
      <Button className="mt-8" render={<Link href="/" />}>
        Back home
      </Button>
    </div>
  );
}
