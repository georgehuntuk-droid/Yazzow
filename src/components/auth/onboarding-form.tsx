"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Globe, User, Sparkles, FileText, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { publicSiteHost, TUTOR_PUBLIC_PATH } from "@/lib/constants";
import { checkUsernameAvailable, completeOnboarding } from "@/lib/tutors/actions";
import { isValidUsername, slugifyUsername } from "@/lib/tutors/utils";

type OnboardingFormProps = {
  defaultDisplayName: string;
};

export function OnboardingForm({ defaultDisplayName }: OnboardingFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(slugifyUsername(defaultDisplayName));
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const normalized = slugifyUsername(username);

    if (!isValidUsername(normalized)) {
      setError("Username must be 3+ characters, lowercase letters, numbers, and hyphens only.");
      setLoading(false);
      return;
    }

    const usernameCheck = await checkUsernameAvailable(normalized);
    if (usernameCheck.error) {
      setError(usernameCheck.error);
      setLoading(false);
      return;
    }
    if (!usernameCheck.available) {
      setError("That username is already taken. Try another.");
      setLoading(false);
      return;
    }

    const result = await completeOnboarding({
      username: normalized,
      displayName: displayName.trim(),
      headline: headline.trim() || undefined,
      bio: bio.trim() || undefined,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const previewUrl = `${publicSiteHost()}${TUTOR_PUBLIC_PATH}/${slugifyUsername(username) || "your-name"}`;

  return (
    <Card className="yazz-surface border-primary/10 shadow-[0_8px_32px_oklch(0.42_0.15_286/0.1)] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="font-heading text-2xl font-bold tracking-tight">Claim your portal link</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Choose a unique username and set up your public profile. This becomes your private booking page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Choose your username
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Globe className="size-4" />
              </div>
              <Input
                id="username"
                required
                value={username}
                onChange={(e) => setUsername(slugifyUsername(e.target.value))}
                placeholder="maya-chen"
                className="pl-10 h-10"
              />
            </div>
          </div>

          {/* Live URL Preview Box */}
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3.5 space-y-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Your Public Portal Link</p>
            <code className="block truncate text-sm font-semibold text-foreground select-all">
              {previewUrl}
            </code>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="displayName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Display name
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <User className="size-4" />
              </div>
              <Input
                id="displayName"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Maya Chen"
                className="pl-10 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="headline" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Headline
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Sparkles className="size-4" />
              </div>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="GCSE Maths · calm, structured sessions"
                className="pl-10 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bio" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Bio / Introduction
            </label>
            <div className="relative">
              <textarea
                id="bio"
                rows={4}
                className="flex w-full rounded-xl border border-input bg-card/80 px-3 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/15 dark:bg-input/30"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell parents a little about your tutoring background, qualifications, and teaching style…"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-medium">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full h-10 text-sm font-semibold" disabled={loading}>
            {loading ? (
              "Launching…"
            ) : (
              <span className="inline-flex items-center gap-1.5">
                Launch my portal
                <ArrowRight className="size-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
