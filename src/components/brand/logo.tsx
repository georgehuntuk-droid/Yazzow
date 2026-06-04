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
  const isHeader = size === "header";
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center gap-3.5 transition-opacity hover:opacity-90",
        className,
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 shadow-md ring-2 ring-white/20 transition-all group-hover:scale-105 group-hover:rotate-3",
        isHeader ? "size-12 sm:size-14" : size === "md" ? "size-14 sm:size-16" : "size-20 sm:size-24"
      )}>
        <span className={cn(
          "font-heading font-black tracking-tight text-white select-none",
          isHeader ? "text-2xl sm:text-3xl" : size === "md" ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl"
        )}>
          Y
        </span>
      </div>
      <span className={cn(
        "font-heading font-black tracking-tight text-foreground selection:bg-blue-100",
        isHeader ? "text-2xl sm:text-3xl" : size === "md" ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl"
      )}>
        yazz<span className="text-blue-500">o</span>w
      </span>
    </Link>
  );
}
