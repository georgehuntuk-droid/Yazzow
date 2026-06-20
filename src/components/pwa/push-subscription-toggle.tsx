"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePushSubscription, deletePushSubscription } from "@/lib/dashboard/actions";
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

export function PushSubscriptionToggle({ className }: { className?: string }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setSupported(true);

      // Check if we are already subscribed on this device
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  async function handleToggle() {
    if (!supported || loading) return;
    setLoading(true);

    try {
      if (subscribed) {
        // Unsubscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await deletePushSubscription(subscription.endpoint);
        }
        setSubscribed(false);
      } else {
        // Request Permission
        const requestedPermission = await Notification.requestPermission();

        if (requestedPermission !== "granted") {
          alert("Notification permission denied. Please enable them in your browser/device settings.");
          setLoading(false);
          return;
        }

        // Subscribe
        const registration = await navigator.serviceWorker.ready;
        
        if (!VAPID_PUBLIC_KEY) {
          console.warn("VAPID public key is missing from environment variables.");
          alert("Push notification setup is incomplete. VAPID public key is missing.");
          setLoading(false);
          return;
        }

        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        const subJson = subscription.toJSON();
        if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
          const result = await savePushSubscription({
            endpoint: subJson.endpoint,
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          });

          if (!result.ok) {
            alert(result.error || "Failed to save push subscription.");
            await subscription.unsubscribe();
            setSubscribed(false);
          } else {
            setSubscribed(true);
          }
        }
      }
    } catch (err: any) {
      console.error("Error toggling push subscription:", err);
      alert("Failed to configure push notifications. Ensure this site is installed as a PWA (added to Home Screen) if on iOS.");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "rounded-xl font-semibold gap-1.5 transition-all text-xs h-9 cursor-pointer",
        subscribed
          ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
          : "border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground bg-background/50",
        className
      )}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : subscribed ? (
        <Bell className="size-3.5 fill-primary" />
      ) : (
        <BellOff className="size-3.5" />
      )}
      {subscribed ? "Alerts On" : "Enable Alerts"}
    </Button>
  );
}
