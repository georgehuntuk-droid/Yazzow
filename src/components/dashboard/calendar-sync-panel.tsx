"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Calendar, Check, Copy, ExternalLink, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { disconnectGoogleCalendar, rotateCalendarFeedToken } from "@/lib/calendar/actions";
import type { TutorCalendarSettings } from "@/lib/calendar/queries";

type CalendarSyncPanelProps = {
  settings: TutorCalendarSettings | null;
  googleConfigured: boolean;
};

const statusMessages: Record<string, string> = {
  "google-connected": "Google Calendar connected. New bookings will appear automatically.",
  "google-disconnected": "Google Calendar disconnected.",
  "google-denied": "Google sign-in was cancelled.",
  "google-failed": "Could not connect Google Calendar. Try again.",
  "google-no-refresh": "Google did not return a refresh token. Disconnect the app in your Google account and try again.",
  "google-not-configured": "Google Calendar is not set up on this server yet (missing API keys).",
};

export function CalendarSyncPanel({ settings, googleConfigured }: CalendarSyncPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const calendarStatus = searchParams.get("calendar");
  const [copied, setCopied] = useState<"https" | "webcal" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyUrl(url: string, kind: "https" | "webcal") {
    await navigator.clipboard.writeText(url);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleRotateFeed() {
    if (!confirm("This invalidates your old calendar link. Update subscriptions on all devices.")) {
      return;
    }
    setLoading(true);
    setError(null);
    const result = await rotateCalendarFeedToken();
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  async function handleDisconnectGoogle() {
    setLoading(true);
    setError(null);
    const result = await disconnectGoogleCalendar();
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  if (!settings) {
    const isDev = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    return (
      <Card className="yazz-surface border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            Calendar sync
          </CardTitle>
          <CardDescription>
            {isDev ? (
              <>
                Run migration <code className="text-xs">003_calendar_integration.sql</code> in Supabase
                to enable iCal and Google Calendar.
              </>
            ) : (
              "Calendar integration is currently undergoing maintenance. Please check back later."
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="yazz-surface">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-5 text-primary" />
          Calendar sync
        </CardTitle>
        <CardDescription>
          Subscribe in Apple Calendar (iCal), Outlook, or Google Calendar. Confirmed lesson bookings
          sync automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {calendarStatus && statusMessages[calendarStatus] ? (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {statusMessages[calendarStatus]}
          </p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Apple Calendar · Outlook · iCal</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Subscribe once — your calendar stays updated when parents book lessons.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyUrl(settings.feedUrl, "https")}
            >
              {copied === "https" ? (
                <>
                  <Check className="size-4" data-icon="inline-start" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" data-icon="inline-start" />
                  Copy subscribe URL
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyUrl(settings.webcalUrl, "webcal")}
            >
              {copied === "webcal" ? (
                <>
                  <Check className="size-4" data-icon="inline-start" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" data-icon="inline-start" />
                  Copy webcal link
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={handleRotateFeed}
            >
              <RefreshCw className="size-4" data-icon="inline-start" />
              Reset link
            </Button>
          </div>
          <p className="break-all rounded-lg bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
            {settings.feedUrl}
          </p>
          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
            <li>
              <strong>Mac/iPhone:</strong> Calendar → File → New Calendar Subscription (paste URL)
            </li>
            <li>
              <strong>Google Calendar:</strong> Other calendars → + → From URL → paste subscribe URL
            </li>
            <li>
              <strong>Outlook:</strong> Add calendar → Subscribe from web
            </li>
          </ul>
        </div>

        <div className="space-y-4 border-t border-border/60 pt-6">
          <div>
            <h3 className="text-sm font-semibold">Google Calendar</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              New bookings are added to your Google Calendar as events (one-way sync).
            </p>
          </div>
          {googleConfigured ? (
            settings.googleConnected ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Check className="size-3.5" />
                  Connected
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={handleDisconnectGoogle}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button size="sm" render={<Link href="/api/calendar/google/connect" />}>
                <ExternalLink className="size-4" data-icon="inline-start" />
                Connect Google Calendar
              </Button>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Google sync requires <code className="text-xs">GOOGLE_CLIENT_ID</code> and{" "}
              <code className="text-xs">GOOGLE_CLIENT_SECRET</code> in your environment.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
