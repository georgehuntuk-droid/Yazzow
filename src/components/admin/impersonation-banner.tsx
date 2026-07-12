"use client";

import { useState } from "react";
import { stopImpersonationAction } from "@/lib/dashboard/admin-actions";
import { ShieldAlert, LogOut, LayoutGrid } from "lucide-react";

type ImpersonationBannerProps = {
  impersonatedEmail: string;
};

export function ImpersonationBanner({ impersonatedEmail }: ImpersonationBannerProps) {
  const [loading, setLoading] = useState(false);

  const handleStop = async () => {
    setLoading(true);
    try {
      await stopImpersonationAction();
      window.location.href = "/admin";
    } catch (err) {
      console.error("Failed to stop impersonation:", err);
      setLoading(false);
    }
  };

  return (
    <div className="sticky top-0 z-[9999] w-full bg-red-600/90 text-white backdrop-blur-md px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-md animate-in slide-in-from-top-full duration-300">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 animate-pulse text-amber-300" />
        <span>
          Admin View: Impersonating <strong className="underline decoration-wavy decoration-amber-300 decoration-1">{impersonatedEmail}</strong>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="/admin"
          className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition"
        >
          <LayoutGrid className="size-3.5" />
          Admin Console
        </a>
        <button
          onClick={handleStop}
          disabled={loading}
          className="inline-flex items-center gap-1 bg-white text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 font-bold"
        >
          <LogOut className="size-3.5" />
          Exit Session
        </button>
      </div>
    </div>
  );
}
