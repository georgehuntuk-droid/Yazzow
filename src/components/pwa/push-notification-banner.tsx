"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePushSubscription } from "@/lib/dashboard/actions";
import { cn } from "@/lib/utils";

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

export function PushNotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  useEffect(() => {
    // Check if push notifications are supported and permission is not already granted/denied
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      typeof Notification !== "undefined"
    ) {
      let dismissed = false;
      try {
        dismissed = localStorage.getItem("yazzow-push-dismissed") === "true";
      } catch (e) {
        console.warn("localStorage is blocked or unavailable:", e);
      }
      const isDefault = Notification.permission === "default";
      
      if (isDefault && !dismissed) {
        setVisible(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem("yazzow-push-dismissed", "true");
    } catch (e) {
      console.warn("localStorage is blocked or unavailable:", e);
    }
    setVisible(false);
  };

  const handleEnable = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Request Browser Permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Notification permission was denied. If you change your mind, you can enable them in your browser/device site settings.");
        handleDismiss();
        setLoading(false);
        return;
      }

      // 2. Subscribe using Service Worker
      const registration = await navigator.serviceWorker.ready;
      
      if (!VAPID_PUBLIC_KEY) {
        console.warn("VAPID public key is missing from environment variables.");
        handleDismiss();
        setLoading(false);
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // 3. Save subscription to DB
      const subJson = subscription.toJSON();
      if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        const result = await savePushSubscription({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        });

        if (!result.ok) {
          alert(result.error || "Failed to save push subscription to your profile.");
          await subscription.unsubscribe();
        } else {
          // Success! Save dismissed key and close banner
          try {
            localStorage.setItem("yazzow-push-dismissed", "true");
          } catch (e) {
            console.warn("localStorage is blocked or unavailable:", e);
          }
          setVisible(false);
          alert("Push notifications enabled! You will now receive instant alerts for chat messages and lesson updates.");
        }
      }
    } catch (err) {
      console.error("Error setting up push notifications:", err);
      alert("Failed to configure push notifications. Ensure this site is installed as a PWA (added to Home Screen) if you are on iOS.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/[0.03] to-transparent p-5 sm:p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-primary/30" />
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BellRing className="size-5 animate-bounce" />
        </div>
        <div className="flex-1 space-y-1.5 pr-6">
          <h4 className="font-heading text-sm font-bold text-foreground">
            Enable Push Notifications
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            Stay updated instantly! Receive real-time push alerts on your phone or desktop whenever your tutor posts tasks, cancels lessons, or sends you chat messages.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={loading}
              className="h-8 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 shadow-sm shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3 mr-1.5 animate-spin" />
                  Enabling…
                </>
              ) : (
                "Enable Alerts"
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={loading}
              className="h-8 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Not Now
            </Button>
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
