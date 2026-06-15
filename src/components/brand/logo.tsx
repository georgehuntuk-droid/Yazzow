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

const textSizes = {
  header: "text-2xl font-bold tracking-tight ml-2.5",
  md: "text-3xl sm:text-4xl font-bold tracking-tight ml-3",
  lg: "text-6xl sm:text-7xl font-extrabold tracking-tight ml-5",
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


