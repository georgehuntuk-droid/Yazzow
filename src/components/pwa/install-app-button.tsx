"use client";

import { useEffect, useState } from "react";
import { Download, X, AppWindow, Share, Plus, Monitor, Smartphone, Check } from "lucide-react";
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

type InstallAppButtonProps = {
  className?: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
};

export function InstallAppButton({
  className = "",
  variant = "default",
  size = "default",
  showText = true,
}: InstallAppButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const win = window as any;
      const isIOSUser = isIOSDevice();
      const isMacUser = isMacDevice();
      const installed = isStandaloneMode();

      setIsIOS(isIOSUser);
      setIsMac(isMacUser);
      setIsInstalled(installed);

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

  const handleClick = async () => {
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
    } else if (isIOS || isMac) {
      setShowModal(true);
    } else {
      // Fallback: If no deferred prompt is registered and not Apple, show instructions dialog
      setShowModal(true);
    }
  };

  if (!initialized) return null;

  // If already installed, show a checked status button
  if (isInstalled) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={`rounded-xl border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 gap-1.5 opacity-90 ${className}`}
      >
        <Check className="size-4" />
        {showText && "App Installed"}
      </Button>
    );
  }

  // If we cannot install and it's not Apple (meaning standard desktop browser where install isn't supported/available)
  // we can still render the button to open instructions, or hide it.
  // The user requested a clear button on the main screen, so let's always show it, and guide them in a modal.

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={`rounded-xl font-semibold gap-1.5 transition-all cursor-pointer ${className}`}
      >
        <Download className="size-4 animate-bounce" />
        {showText && "Download App"}
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
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

            {/* Content */}
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              {isIOS ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Smartphone className="size-4 text-primary" />
                    iPhone / iPad Instructions
                  </div>
                  <p>Add Yazzow to your Home Screen in 2 simple steps:</p>
                  <ol className="list-decimal list-inside space-y-2.5 bg-muted/40 p-3 rounded-2xl border border-border/40 text-[13px]">
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
                    macOS (Safari / Chrome)
                  </div>
                  <p>To install Yazzow on your Mac desktop:</p>
                  <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/40 space-y-2 text-[13px]">
                    <p className="font-semibold text-foreground">Using Safari:</p>
                    <ul className="list-disc list-inside pl-1 space-y-1 text-xs">
                      <li>
                        Go to the top menu and select <strong>File &gt; Add to Dock</strong>.
                      </li>
                    </ul>
                    <p className="font-semibold text-foreground pt-1.5">Using Chrome / Edge:</p>
                    <ul className="list-disc list-inside pl-1 space-y-1 text-xs">
                      <li>
                        Click the <strong>Install</strong> icon in the right side of the address bar, or select <strong>Install Yazzow...</strong> from the browser settings menu.
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Monitor className="size-4 text-primary" />
                    Browser Installation
                  </div>
                  <p>To install Yazzow as a desktop or mobile application:</p>
                  <ul className="list-disc list-inside pl-1 space-y-1.5 bg-muted/40 p-3 rounded-2xl border border-border/40 text-[13px]">
                    <li>
                      <strong>On Chrome/Edge (Desktop)</strong>: Click the small icon on the right side of the URL address bar.
                    </li>
                    <li>
                      <strong>On Android (Chrome)</strong>: Tap the three dots menu <span className="font-bold text-foreground">&vellip;</span> in the top-right and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl px-5 font-bold cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
