import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "header" | "md" | "lg";
  iconOnly?: boolean;
  businessLogoUrl?: string | null;
  businessName?: string | null;
};

const logoHeights = {
  header: "h-12 sm:h-14",
  md: "h-18 sm:h-22",
  lg: "h-32 sm:h-40",
} as const;

export function Logo({ 
  className, 
  href = "/", 
  size = "header", 
  iconOnly = false,
  businessLogoUrl,
  businessName
}: LogoProps) {
  if (businessLogoUrl) {
    return (
      <Link
        href={href}
        className={cn(
          "group inline-flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-95",
          className,
        )}
      >
        <img
          src={businessLogoUrl}
          alt={businessName || "Academy Logo"}
          className={cn(
            "w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]",
            logoHeights[size]
          )}
        />
        {!iconOnly && businessName && (
          <span className="font-heading text-base sm:text-lg font-black tracking-tight text-foreground">
            {businessName}
          </span>
        )}
      </Link>
    );
  }

  if (businessName) {
    return (
      <Link
        href={href}
        className={cn(
          "group inline-flex shrink-0 items-center transition-opacity hover:opacity-95",
          className,
        )}
      >
        <span className="font-heading text-lg sm:text-xl font-black tracking-tight text-primary">
          {businessName}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center transition-opacity hover:opacity-95",
        className,
      )}
    >
      <img
        src={iconOnly ? "/yazzow-brand-icon.png?v=4" : "/yazzow-logo-transparent.png?v=4"}
        alt="Yazzow Logo"
        className={cn(
          "w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02] dark:brightness-110",
          logoHeights[size]
        )}
      />
    </Link>
  );
}



