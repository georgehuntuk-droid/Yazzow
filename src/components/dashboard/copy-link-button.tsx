"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

type CopyLinkButtonProps = {
  url: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
};

export function CopyLinkButton({
  url,
  variant = "outline",
  size = "sm",
  className = "",
  showText = true,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`relative inline-flex items-center gap-1.5 font-medium transition-all ${className}`}
    >
      {copied ? (
        <>
          <Check className="size-4 text-emerald-500 shrink-0" />
          {showText && <span className="text-emerald-500 font-semibold">Copied!</span>}
        </>
      ) : (
        <>
          <Copy className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
          {showText && <span>Copy portal link</span>}
        </>
      )}
    </Button>
  );
}
