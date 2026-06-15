import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "header" | "md" | "lg";
};

const logoHeights = {
  header: "h-11 sm:h-14",
  md: "h-16 sm:h-20",
  lg: "h-28 sm:h-36",
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
      <img
        src="/yazzow-brand-icon.png"
        alt="Yazzow Logo"
        className={cn(
          "w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]",
          logoHeights[size]
        )}
      />
    </Link>
  );
}


