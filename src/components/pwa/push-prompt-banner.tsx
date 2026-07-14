"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, X, Loader2, Check, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

type PushPromptBannerProps = {
  role: "parent" | "tutor" | "guest";
  userId?: string;
};

export function PushPromptBanner({ role, userId }: PushPromptBannerProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"default" | "success">("default");
  const [isIosPrompt, setIsIosPrompt] = useState(false);

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if user previously dismissed prompt
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("yazzow-push-prompt-dismissed") === "true";
    } catch (e) {
      console.warn("[PushPrompt] localStorage is unavailable:", e);
    }
    if (dismissed) return;

    // Detect iOS + Non-Standalone (not downloaded/added to home screen)
    if (isIOSDevice() && !isStandaloneMode()) {
      setIsIosPrompt(true);
      setVisible(true);
      return;
    }

    // Hide if browser doesn't support service workers or push natively
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      typeof Notification === "undefined"
    ) {
      return;
    }

    // Hide if user already granted permission
    if (Notification.permission === "granted") {
      return;
    }

    setVisible(true);
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem("yazzow-push-prompt-dismissed", "true");
    } catch (e) {
      console.warn("[PushPrompt] localStorage is unavailable:", e);
    }
    setVisible(false);
  };

  const handleEnable = async () => {
    if (loading || status === "success" || isIosPrompt) return;
    setLoading(true);

    try {
      // 1. Request native notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("[PushPrompt] Notification permission denied or closed.");
        setLoading(false);
        return;
      }

      // 2. Register push subscription with active service worker
      const registration = await navigator.serviceWorker.ready;
      if (!VAPID_PUBLIC_KEY) {
        throw new Error("VAPID public key is missing from environment.");
      }

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // 3. Send subscription object to server endpoint
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register subscription with server");
      }

      // 4. Success UI animation feedback
      setStatus("success");
      setLoading(false);

      // Save dismissed state so they aren't prompted again
      try {
        localStorage.setItem("yazzow-push-prompt-dismissed", "true");
      } catch (e) {
        console.warn("[PushPrompt] localStorage is unavailable:", e);
      }

      // Smoothly hide card after 3 seconds
      setTimeout(() => {
        setVisible(false);
      }, 3000);
    } catch (err) {
      console.error("[PushPrompt] Error configuring push notifications:", err);
      setLoading(false);
    }
  };

  if (!visible) return null;

  // iOS Standalone app installation guidance
  if (isIosPrompt) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/[0.03] to-transparent p-5 sm:p-6 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-top-4">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-primary/30" />
        
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BellRing className="size-5 animate-bounce" />
          </div>
          
          <div className="flex-1 space-y-2 pr-6">
            <h4 className="font-heading text-sm font-bold text-foreground">
              📱 Install App for Cancellation Alerts
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              To receive instant slot alerts and last-minute cancellation notifications directly on your lock screen, you must add Yazzow to your Home Screen.
            </p>
            
            <div className="rounded-xl bg-muted/40 border border-border/50 p-3.5 space-y-2.5 max-w-lg mt-1 text-[11px] text-muted-foreground font-semibold">
              <p className="flex items-center gap-1.5 leading-none">
                1. Tap the Share button <span className="inline-flex p-1 rounded bg-background border border-border text-foreground"><Share className="size-3" /></span> in Safari.
              </p>
              <p className="flex items-center gap-1.5 leading-none">
                2. Scroll down and tap <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border border-border text-foreground font-bold"><Plus className="size-3" /> Add to Home Screen</span>.
              </p>
              <p className="leading-relaxed">
                3. Open the newly downloaded app from your Home Screen to enable instant push notifications!
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  const parentCopy = "⚡ Get Instant Slot Alerts! Tap to enable lock-screen notifications so you're instantly alerted the absolute second a last-minute cancellation opens up with your tutor.";
  const tutorCopy = "📱 Never Miss a Booking! Turn on push notifications to instantly know when a new student schedules a lesson or changes an appointment.";
  const guestCopy = "⚡ Get Yazzow Updates! Turn on push notifications to receive real-time feature announcements, tips, and platform updates.";
  const copyText = role === "parent" ? parentCopy : role === "tutor" ? tutorCopy : guestCopy;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/[0.03] to-transparent p-5 sm:p-6 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-top-4">
      {/* Visual Accent bar */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-primary/30" />
      
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BellRing className="size-5 animate-pulse" />
        </div>
        
        <div className="flex-1 space-y-1.5 pr-6">
          <h4 className="font-heading text-sm font-bold text-foreground">
            {role === "parent" ? "Stay Instantly Updated" : "Enable Push Notifications"}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            {copyText}
          </p>
          
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={loading || status === "success"}
              className={`h-8 rounded-lg text-xs font-bold px-4 shadow-sm shrink-0 cursor-pointer transition-all duration-300 ${
                status === "success" 
                  ? "bg-green-600 hover:bg-green-600 text-white cursor-default" 
                  : "bg-primary hover:bg-primary/90 text-white"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="size-3 mr-1.5 animate-spin" />
                  Enabling…
                </>
              ) : status === "success" ? (
                <>
                  <Check className="size-3.5 mr-1 text-white stroke-[3px]" />
                  Notifications Active!
                </>
              ) : (
                "Enable Alerts"
              )}
            </Button>
            
            {status !== "success" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Not Now
              </Button>
            )}
          </div>
        </div>

        {status !== "success" && (
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
