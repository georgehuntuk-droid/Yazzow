"use client";

import { useEffect, useState } from "react";
import { Download, X, AppWindow, Share, Smartphone, Bell, Sparkles, Monitor, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

function isIOSDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isMacDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /Mac|Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent) &&
    !/iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(navigator.maxTouchPoints > 1)
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
  const [isMac, setIsMac] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check local storage for dismissal
    let isDismissed = false;
    try {
      isDismissed = localStorage.getItem("yazzow-pwa-banner-dismissed") === "true";
    } catch (e) {
      console.warn("localStorage is blocked or unavailable:", e);
    }
    if (isDismissed) {
      setDismissed(true);
    }

    const checkInstalledApps = async () => {
      if (typeof navigator !== "undefined" && "getInstalledRelatedApps" in navigator) {
        try {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          if (relatedApps && relatedApps.length > 0) {
            setIsInstalled(true);
            return true;
          }
        } catch (err) {
          console.warn("Failed to check installed related apps:", err);
        }
      }
      return false;
    };

    const checkStatus = async () => {
      const win = window as any;
      const isIOSUser = isIOSDevice();
      const isMacUser = isMacDevice();
      const installed = isStandaloneMode();

      setIsIOS(isIOSUser);
      setIsMac(isMacUser);

      if (installed) {
        setIsInstalled(true);
      } else {
        await checkInstalledApps();
      }

      if (win.deferredPrompt) {
        setInstallPrompt(win.deferredPrompt);
      }

      setInitialized(true);
    };

    checkStatus();

    const handleCanInstall = () => {
      const win = window as any;
      setInstallPrompt(win.deferredPrompt);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
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
    if (isInstalled) return;

    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true);
        }
      } catch (err) {
        console.error("Installation prompt failed:", err);
      } finally {
        const win = window as any;
        win.deferredPrompt = null;
        setInstallPrompt(null);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("yazzow-pwa-banner-dismissed", "true");
    } catch (e) {
      console.warn("localStorage is blocked or unavailable:", e);
    }
  };

  if (!initialized || isInstalled || dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-5 sm:p-6 shadow-md transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Background glow effects */}
      <div className="absolute -right-16 -top-16 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 text-muted-foreground/60 hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X className="size-4" />
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              📱 PWA Mobile & Desktop App
            </span>
            <span className="flex items-center gap-0.5 text-xs text-primary font-bold">
              <Sparkles className="size-3.5 fill-primary" /> Recommended
            </span>
          </div>

          <h2 className="font-heading text-lg sm:text-xl font-black text-foreground leading-tight">
            Unlock the Ultimate Classroom Experience
          </h2>
          
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Install Yazzow on your phone or computer to receive instant homework alerts, chat instantly with your tutor, and manage lessons directly from your home screen.
          </p>

          {/* Key Value Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] font-bold text-foreground">
            <div className="flex items-center gap-2 bg-background/50 border border-border/40 px-3 py-1.5 rounded-xl">
              <Bell className="size-3.5 text-primary shrink-0" />
              <span>Real-time Alerts</span>
            </div>
            <div className="flex items-center gap-2 bg-background/50 border border-border/40 px-3 py-1.5 rounded-xl">
              <Smartphone className="size-3.5 text-blue-500 shrink-0" />
              <span>One-tap Launch</span>
            </div>
            <div className="flex items-center gap-2 bg-background/50 border border-border/40 px-3 py-1.5 rounded-xl">
              <Sparkles className="size-3.5 text-amber-500 shrink-0" />
              <span>Faster Performance</span>
            </div>
          </div>
        </div>

        <div className="flex sm:items-center gap-3 shrink-0 self-start md:self-center">
          <Button
            onClick={handleInstallClick}
            className="rounded-xl px-5 py-2 text-xs font-black gap-2 bg-primary text-primary-foreground hover:opacity-90 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer h-10"
          >
            <Download className="size-4 animate-bounce" />
            Install App
          </Button>
        </div>
      </div>

      {/* Instructions Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowModal(false)}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
              <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                <AppWindow className="size-5 text-primary" />
                Install Yazzow App
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
              {isIOS ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Smartphone className="size-4 text-primary" />
                    iPhone / iPad Instructions
                  </div>
                  <p>Add Yazzow to your Home Screen in 2 simple steps:</p>
                  <ol className="list-decimal list-inside space-y-2.5 bg-muted/40 p-3.5 rounded-2xl border border-border/40">
                    <li>
                      Tap the <strong>Share</strong> button{" "}
                      <Share className="inline-block size-4 mx-0.5 text-primary" /> at the
                      bottom (or top) of Safari.
                    </li>
                    <li>
                      Scroll down the list and tap{" "}
                      <strong>Add to Home Screen</strong>{" "}
                      <Plus className="inline-block size-4 mx-0.5 text-primary" />.
                    </li>
                  </ol>
                </div>
              ) : isMac ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Monitor className="size-4 text-primary" />
                    Safari on macOS Instructions
                  </div>
                  <p>Add Yazzow to your Dock as a standalone app:</p>
                  <ol className="list-decimal list-inside space-y-2.5 bg-muted/40 p-3.5 rounded-2xl border border-border/40">
                    <li>
                      Click the <strong>Share</strong> button{" "}
                      <Share className="inline-block size-4 mx-0.5 text-primary" /> in the Safari toolbar.
                    </li>
                    <li>
                      Select <strong>Add to Dock</strong> from the menu.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Info className="size-4 text-primary" />
                    Standard Browser Instructions
                  </div>
                  <p>To install Yazzow on your current browser:</p>
                  <ul className="list-disc list-inside space-y-2.5 bg-muted/40 p-3.5 rounded-2xl border border-border/40">
                    <li>
                      Look for the <strong>App Install</strong> icon in the address bar (usually a computer with an arrow or a plus sign).
                    </li>
                    <li>
                      Or click the browser menu (three dots/lines) and select <strong>Save and Share → Install App</strong> or <strong>Install Yazzow</strong>.
                    </li>
                  </ul>
                </div>
              )}
              <div className="pt-2 text-[10px] text-center border-t border-border/40">
                Once installed, open the app to easily enable instant push notifications!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
