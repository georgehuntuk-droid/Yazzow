import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "header" | "md" | "lg";
  iconOnly?: boolean;
};

const logoHeights = {
  header: "h-12 sm:h-14",
  md: "h-18 sm:h-22",
  lg: "h-32 sm:h-40",
} as const;

export function Logo({ className, href = "/", size = "header", iconOnly = false }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center transition-opacity hover:opacity-95",
        className,
      )}
    >
      <img
        src={iconOnly ? "/yazzow-brand-icon.png" : "/yazzow-logo-transparent.png"}
        alt="Yazzow Logo"
        className={cn(
          "w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02] dark:brightness-110",
          logoHeights[size]
        )}
      />
    </Link>
  );
}



