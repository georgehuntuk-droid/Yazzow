"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

type HeroPreviewProps = {
  children: React.ReactNode;
  className?: string;
};

export function HeroPreview({ children, className }: HeroPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1200px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn("yazz-float relative transition-transform duration-200 ease-out will-change-transform", className)}
    >
      {children}
    </div>
  );
}
