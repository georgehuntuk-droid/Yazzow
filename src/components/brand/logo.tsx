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
        "group inline-flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90",
        className,
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-violet-500 shadow-md ring-2 ring-white/20 transition-all group-hover:scale-105 group-hover:rotate-3",
        isHeader ? "size-10 sm:size-11" : size === "md" ? "size-12 sm:size-14" : "size-16 sm:size-20"
      )}>
        <span className={cn(
          "font-heading font-black tracking-tight text-white select-none",
          isHeader ? "text-xl sm:text-2xl" : size === "md" ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"
        )}>
          Y
        </span>
      </div>
      <span className={cn(
        "font-heading font-black tracking-tight text-foreground selection:bg-amber-100",
        isHeader ? "text-xl sm:text-2xl" : size === "md" ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"
      )}>
        yazz<span className="text-rose-500">o</span>w
      </span>
    </Link>
  );
}
