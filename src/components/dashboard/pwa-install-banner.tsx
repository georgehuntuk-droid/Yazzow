"use client";
import { useEffect, useState } from "react";
import { Download, X, Sparkles, AppWindow, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

function isIOSDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if dismissed already
    const isDismissed = localStorage.getItem("pwa-banner-dismissed") === "true";
    if (isDismissed) return;
    
    const win = window as any;
    const isIOSUser = isIOSDevice();
    const isInstalled = isStandaloneMode();

    if (isIOSUser && !isInstalled) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    if (win.deferredPrompt && !isInstalled) {
      setInstallPrompt(win.deferredPrompt);
      setShowBanner(true);
    }

    const handleCanInstall = () => {
      if (!localStorage.getItem("pwa-banner-dismissed") && !isStandaloneMode()) {
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
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="size-4" />
        </button>

        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-blue-600 text-white shadow-md shadow-blue-500/10">
            <AppWindow className="size-6 animate-pulse" />
          </div>
          
          <div className="space-y-1 pr-6 flex-1">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              {isIOS ? "Install App on iPhone" : "Download App"}
              <Sparkles className="size-3.5 text-primary" />
            </h4>
            
            {isIOS ? (
              <div className="text-xs text-muted-foreground space-y-1.5 mt-1 leading-normal">
                <p>Add Yazzow to your Home Screen in 2 simple steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] bg-muted/40 p-2 rounded-xl border border-border/40">
                  <li>
                    Tap the <strong>Share</strong> button <Share className="inline-block size-3.5 mx-0.5 text-primary" /> at the bottom of Safari.
                  </li>
                  <li>
                    Scroll down and select <strong>Add to Home Screen</strong> <Plus className="inline-block size-3.5 mx-0.5 text-primary" />.
                  </li>
                </ol>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Install Yazzow on your home screen for instant schedule building, payments, and student messaging.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 transition-colors cursor-pointer"
          >
            {isIOS ? "Dismiss" : "Later"}
          </button>
          {!isIOS ? (
            <Button
              type="button"
              size="sm"
              onClick={handleInstallClick}
              className="rounded-xl bg-primary text-white text-xs font-bold shadow-sm shadow-blue-500/15"
            >
              <Download className="size-3.5 mr-1" />
              Install App
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleDismiss}
              className="rounded-xl bg-primary text-white text-xs font-bold shadow-sm shadow-blue-500/15"
            >
              Got it
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
