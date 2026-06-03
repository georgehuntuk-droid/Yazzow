"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type SpotlightCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={cn(
        "yazz-surface group relative overflow-hidden transition duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_16px_48px_oklch(0.42_0.15_286/0.15)]",
        className,
      )}
      style={
        hovering
          ? {
              background: `radial-gradient(600px circle at ${position.x}% ${position.y}%, oklch(0.52 0.17 286 / 0.12), transparent 40%), oklch(0.995 0.006 286 / 0.85)`,
            }
          : undefined
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${position.x}% ${position.y}%, oklch(0.52 0.17 286 / 0.18), transparent 45%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
