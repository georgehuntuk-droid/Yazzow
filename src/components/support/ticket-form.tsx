"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const categories = [
  { value: "bug", label: "Something broken" },
  { value: "billing", label: "Payments & billing" },
  { value: "account", label: "Account & login" },
  { value: "feature", label: "Feature request" },
  { value: "other", label: "Something else" },
] as const;

type SupportTicketFormProps = {
  source?: string;
  className?: string;
  configured?: boolean;
};

export function SupportTicketForm({
  source = "support page",
  className,
  configured = true,
}: SupportTicketFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, message, source }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not send ticket.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className={cn("yazz-surface border-primary/20", className)}>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Ticket sent</CardTitle>
          <CardDescription>
            We&apos;ve notified the team in Slack. We&apos;ll reply to {email} as soon as we can.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn("yazz-surface", className)}>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Open a support ticket</CardTitle>
        <CardDescription>
          Free Slack integration — your message lands in our team channel instantly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!configured ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Tickets are ready to wire. Add{" "}
            <code className="text-xs">SLACK_WEBHOOK_URL</code> to{" "}
            <code className="text-xs">.env.local</code> (Slack → Apps → Incoming Webhooks — free
            on Slack Free).
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="ticket-name" className="text-sm font-medium">
                Your name
              </label>
              <Input
                id="ticket-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ticket-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="ticket-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="ticket-category" className="text-sm font-medium">
              Category
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="ticket-message" className="text-sm font-medium">
              How can we help?
            </label>
            <textarea
              id="ticket-message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's going on…"
              className="flex w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full sm:w-auto" disabled={loading || !configured}>
            {loading ? "Sending…" : "Send ticket to Slack"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
