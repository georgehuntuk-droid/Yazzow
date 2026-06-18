"use client";

import { useEffect, useState } from "react";

export default function GlobalLoading() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Prevent flash of loading screen for instant loads by introducing a tiny delay
    const timer = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fbfbf8] dark:bg-[#0f172a] transition-colors duration-300">
      <div className="flex flex-col items-center max-w-xs px-6 text-center space-y-6">
        {/* Animated Brand Logo Icon Container */}
        <div className="relative flex items-center justify-center size-20 rounded-2xl bg-gradient-to-tr from-[#446152] to-[#5d7d6c] shadow-[0_8px_30px_rgb(68,97,82,0.15)] animate-pulse">
          {/* Inner glowing effect */}
          <div className="absolute inset-0 rounded-2xl border border-white/25 animate-ping opacity-20 duration-1000" />
          <span className="font-sans text-2xl font-black text-white select-none">y</span>
        </div>

        {/* Text and Spinner */}
        <div className="space-y-3">
          <h3 className="font-heading text-lg font-bold text-[#1e293b] dark:text-[#f8fafc] tracking-tight">
            yazzow
          </h3>
          <p className="text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] tracking-normal animate-pulse">
            Connecting to your classroom…
          </p>
        </div>

        {/* Sleek Line Loading Indicator */}
        <div className="w-40 h-1 bg-[#446152]/10 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#446152] to-[#5d7d6c] rounded-full w-1/2 animate-[loading_1.5s_infinite_ease-in-out]" />
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes loading {
              0% {
                transform: translateX(-100%);
              }
              50% {
                transform: translateX(100%);
              }
              100% {
                transform: translateX(-100%);
              }
            }
          `,
        }}
      />
    </div>
  );
}
