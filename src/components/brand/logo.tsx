import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "header" | "md" | "lg";
};

const logoHeights = {
  header: "h-8 sm:h-9",
  md: "h-11 sm:h-12",
  lg: "h-18 sm:h-20",
} as const;

const textSizes = {
  header: "text-xl font-bold tracking-tight ml-2",
  md: "text-2xl sm:text-3xl font-bold tracking-tight ml-2.5",
  lg: "text-5xl sm:text-6xl font-extrabold tracking-tight ml-4",
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
        src="/yazzow-logo-transparent.png"
        alt="Yazzow Logo"
        className={cn(
          "w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]",
          logoHeights[size]
        )}
      />
      <span
        className={cn(
          "font-sans text-foreground transition-colors",
          textSizes[size]
        )}
      >
        Yazzow
      </span>
    </Link>
  );
}


