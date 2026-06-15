import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "header" | "md" | "lg";
};

const logoHeights = {
  header: "h-9 sm:h-11",
  md: "h-13 sm:h-15",
  lg: "h-20 sm:h-24",
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


