"use client";

import { useRouter } from "next/navigation";
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

  return (
    <Card className="yazz-surface border-primary/10 shadow-[0_8px_32px_oklch(0.42_0.15_286/0.1)]">
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-bold">Claim your portal link</CardTitle>
        <CardDescription>
          Choose a phonetic username for{" "}
          <span className="font-medium text-foreground">
            {publicSiteHost()}
            {TUTOR_PUBLIC_PATH}/your-name
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(slugifyUsername(e.target.value))}
              placeholder="maya-chen"
            />
            <p className="text-xs text-muted-foreground">
              Preview: {publicSiteHost()}
              {TUTOR_PUBLIC_PATH}/{slugifyUsername(username) || "your-name"}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display name
            </label>
            <Input
              id="displayName"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="headline" className="text-sm font-medium">
              Headline
            </label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="GCSE Maths · calm, structured sessions"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell parents a little about your teaching style…"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Launch my portal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
