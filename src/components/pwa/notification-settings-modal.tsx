"use client";

import { useEffect, useState } from "react";
import { X, Bell, Smartphone, Monitor, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isIOSDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isAndroidDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

type NotificationSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsIOS(isIOSDevice());
    setIsAndroid(isAndroidDevice());
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
          <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            Enable Notifications
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Banner */}
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 p-3.5 mb-4 text-xs text-amber-800 dark:text-amber-300 font-medium">
          <ShieldAlert className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
          <p>
            Notifications are currently blocked. To get instant alerts for lessons and chat messages, you can enable them in your device settings.
          </p>
        </div>

        {/* Step-by-Step Guide */}
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          {isIOS ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider">
                <Smartphone className="size-4 text-primary" />
                iOS (iPhone / iPad) Steps
              </div>
              <ol className="list-decimal list-inside space-y-2 bg-muted/40 p-3.5 rounded-2xl border border-border/40 text-[13px]">
                <li>
                  Open your iPhone/iPad <strong>Settings</strong> app.
                </li>
                <li>
                  Scroll down to find and tap <strong>Yazzow</strong> (or your browser Safari).
                </li>
                <li>
                  Tap <strong>Notifications</strong>.
                </li>
                <li>
                  Toggle <strong>Allow Notifications</strong> to <span className="text-emerald-600 dark:text-emerald-400 font-bold">ON</span>.
                </li>
              </ol>
            </div>
          ) : isAndroid ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider">
                <Smartphone className="size-4 text-primary" />
                Android Steps
              </div>
              <ol className="list-decimal list-inside space-y-2 bg-muted/40 p-3.5 rounded-2xl border border-border/40 text-[13px]">
                <li>
                  Tap the <strong>lock settings icon</strong> next to the website URL in the address bar.
                </li>
                <li>
                  Select <strong>Permissions</strong> or <strong>Site Settings</strong>.
                </li>
                <li>
                  Toggle <strong>Notifications</strong> to <span className="text-emerald-600 dark:text-emerald-400 font-bold">Allowed</span>.
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Browser */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider">
                  <Monitor className="size-4 text-primary" />
                  Desktop Browsers (Chrome / Edge)
                </div>
                <ol className="list-decimal list-inside space-y-2 bg-muted/40 p-3.5 rounded-2xl border border-border/40 text-[13px]">
                  <li>
                    Click the <strong>lock or settings tune icon</strong> on the far left of your browser's URL address bar.
                  </li>
                  <li>
                    Locate <strong>Notifications</strong>.
                  </li>
                  <li>
                    Switch the drop-down/toggle to <span className="text-emerald-600 dark:text-emerald-400 font-bold">Allow</span>.
                  </li>
                </ol>
              </div>

              {/* General Note */}
              <p className="text-[11px] leading-normal text-muted-foreground/80 italic">
                Note: In some browsers, you can also manage permissions by going to Settings &gt; Privacy &amp; Security &gt; Site Settings.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 font-bold cursor-pointer"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
