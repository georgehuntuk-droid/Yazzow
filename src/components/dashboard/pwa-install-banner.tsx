"use client";

import { useEffect, useState } from "react";
import { Download, X, Sparkles, AppWindow } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if dismissed already
    const isDismissed = localStorage.getItem("pwa-banner-dismissed") === "true";
    
    // Catch the prompt event if it already fired and was stored on window
    const win = window as any;
    if (win.deferredPrompt && !isDismissed) {
      setInstallPrompt(win.deferredPrompt);
      setShowBanner(true);
    }

    const handleCanInstall = () => {
      if (!localStorage.getItem("pwa-banner-dismissed")) {
        setInstallPrompt(win.deferredPrompt);
        setShowBanner(true);
      }
    };

    const handleInstalled = () => {
      setShowBanner(false);
      setInstallPrompt(null);
    };

    window.addEventListener("pwa-can-install", handleCanInstall);
    window.addEventListener("pwa-installed", handleInstalled);

    return () => {
      window.removeEventListener("pwa-can-install", handleCanInstall);
      window.removeEventListener("pwa-installed", handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show prompt
    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
    } catch (err) {
      console.error("Failed to prompt installation:", err);
    } finally {
      // Clear prompt
      const win = window as any;
      win.deferredPrompt = null;
      setInstallPrompt(null);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-banner-dismissed", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-5 right-5 left-5 md:left-auto md:w-[400px] z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/90 p-5 shadow-[0_12px_40px_oklch(0.55_0.18_250/0.18)] backdrop-blur-md">
        {/* Glow decoration */}
        <div className="absolute -top-10 -right-10 size-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="size-4" />
        </button>

        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-blue-600 text-white shadow-md shadow-blue-500/10">
            <AppWindow className="size-6 animate-pulse" />
          </div>
          
          <div className="space-y-1 pr-6">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              Download Desktop App
              <Sparkles className="size-3.5 text-primary" />
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Install Yazzow on your home screen for instant schedule building, payments, and student messaging.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2.5">
          <button
            onClick={handleDismiss}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 transition-colors cursor-pointer"
          >
            Later
          </button>
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="rounded-xl bg-primary text-white text-xs font-bold shadow-sm shadow-blue-500/15"
          >
            <Download className="size-3.5 mr-1" />
            Install App
          </Button>
        </div>
      </div>
    </div>
  );
}
