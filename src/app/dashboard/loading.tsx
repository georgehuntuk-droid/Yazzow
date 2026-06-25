"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center space-y-3 animate-in fade-in duration-200">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-xs font-semibold text-muted-foreground">Loading section...</p>
    </div>
  );
}
