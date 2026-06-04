import Image from "next/image";
import Link from "next/link";

import { BRAND_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "header" | "md" | "lg";
};

/** Full wordmark image — icon + YAZZOW text from your original asset. */
const sizeClasses = {
  header: "h-12 w-auto sm:h-[3.25rem]",
  md: "h-14 w-auto sm:h-16",
  lg: "h-20 w-auto sm:h-24",
} as const;

export function Logo({ className, href = "/", size = "header" }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center transition-opacity hover:opacity-90",
        className,
      )}
    >
      <Image
        src="/yazzow-logo.png"
        alt={BRAND_NAME}
        width={640}
        height={160}
        priority
        unoptimized
        className={cn("block max-w-none object-contain object-left", sizeClasses[size])}
      />
    </Link>
  );
}
