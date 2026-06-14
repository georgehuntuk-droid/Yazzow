"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalLink, ImageIcon, Trash2 } from "lucide-react";

import { PortalThemeWrapper } from "@/components/tutor/portal-theme-wrapper";
import { PublicProfile } from "@/components/tutor/public-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PORTAL_ACCENT_PRESETS,
  SUPPORTED_CURRENCIES,
  TUTOR_PUBLIC_PATH,
  tutorPublicUrl,
} from "@/lib/constants";
import {
  changePortalUsername,
  removePortalAvatar,
  removePortalCover,
  updatePortalProfile,
  updatePortalStyle,
  uploadPortalAvatar,
  uploadPortalCover,
} from "@/lib/dashboard/profile-actions";
import { slugifyUsername } from "@/lib/tutors/utils";
import type { TutorProfile } from "@/lib/types";

type PortalSettingsProps = {
  profile: TutorProfile;
};

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function PortalSettings({ profile }: PortalSettingsProps) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [headline, setHeadline] = useState(profile.headline);
  const [bio, setBio] = useState(profile.bio);
  const [lessonPrice, setLessonPrice] = useState(centsToInput(profile.lessonPriceCents));
  const [currency, setCurrency] = useState(profile.currency);
  const [username, setUsername] = useState(profile.username);
  const [blockLessonsCount, setBlockLessonsCount] = useState(profile.blockPackageLessonsCount ?? 10);
  const [blockDiscountPercent, setBlockDiscountPercent] = useState(profile.blockPackageDiscountPercent ?? 10);
  const [allowPublicJoining, setAllowPublicJoining] = useState(profile.allowPublicJoining ?? true);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [coverUrl, setCoverUrl] = useState(profile.coverUrl);
  const [portalWelcomeMessage, setPortalWelcomeMessage] = useState(
    profile.portalWelcomeMessage ?? "",
  );
  const [accentPresetId, setAccentPresetId] = useState<string>(() => {
    const match = PORTAL_ACCENT_PRESETS.find(
      (p) => p.oklch === profile.portalAccentOklch,
    );
    return match?.id ?? PORTAL_ACCENT_PRESETS[0].id;
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [packageLoading, setPackageLoading] = useState(false);
  const [styleLoading, setStyleLoading] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const previewProfile = useMemo<TutorProfile>(
    () => ({
      ...profile,
      displayName,
      headline,
      bio,
      username: slugifyUsername(username) || profile.username,
      lessonPriceCents: Math.round(Number.parseFloat(lessonPrice || "0") * 100) || profile.lessonPriceCents,
      currency,
      avatarUrl,
      coverUrl,
      portalWelcomeMessage: portalWelcomeMessage || undefined,
      portalAccentOklch:
        PORTAL_ACCENT_PRESETS.find((p) => p.id === accentPresetId)?.oklch ??
        profile.portalAccentOklch,
      blockPackageLessonsCount: blockLessonsCount,
      blockPackageDiscountPercent: blockDiscountPercent,
      allowPublicJoining,
    }),
    [
      profile,
      displayName,
      headline,
      bio,
      username,
      lessonPrice,
      currency,
      avatarUrl,
      coverUrl,
      portalWelcomeMessage,
      accentPresetId,
      blockLessonsCount,
      blockDiscountPercent,
      allowPublicJoining,
    ],
  );

  const portalPreview = tutorPublicUrl(slugifyUsername(username) || profile.username);

  function flashSuccess(message: string) {
    setSuccess(message);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileLoading(true);
    setError(null);

    const result = await updatePortalProfile({
      displayName,
      headline,
      bio,
      lessonPrice,
      currency,
      allowPublicJoining,
    });

    if (!result.ok) {
      setError(result.error);
      setProfileLoading(false);
      return;
    }

    flashSuccess("Profile updated.");
    router.refresh();
    setProfileLoading(false);
  }

  async function handleSavePackage(event: React.FormEvent) {
    event.preventDefault();
    setPackageLoading(true);
    setError(null);

    const { updateBlockPackagePricing } = await import("@/lib/dashboard/profile-actions");
    const result = await updateBlockPackagePricing({
      lessonsCount: blockLessonsCount,
      discountPercent: blockDiscountPercent,
    });

    if (!result.ok) {
      setError(result.error);
      setPackageLoading(false);
      return;
    }

    flashSuccess("Lesson block package updated.");
    router.refresh();
    setPackageLoading(false);
  }

  async function handleSaveStyle(event: React.FormEvent) {
    event.preventDefault();
    setStyleLoading(true);
    setError(null);

    const result = await updatePortalStyle({
      portalWelcomeMessage,
      portalAccentPresetId: accentPresetId,
    });

    if (!result.ok) {
      setError(result.error);
      setStyleLoading(false);
      return;
    }

    flashSuccess("Portal style updated.");
    router.refresh();
    setStyleLoading(false);
  }

  async function handleSaveUsername(event: React.FormEvent) {
    event.preventDefault();
    setUsernameLoading(true);
    setError(null);

    const result = await changePortalUsername(username);

    if (!result.ok) {
      setError(result.error);
      setUsernameLoading(false);
      return;
    }

    if (result.username) {
      setUsername(result.username);
    }

    flashSuccess("Portal link updated.");
    router.refresh();
    setUsernameLoading(false);
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadPortalAvatar(formData);

    if (!result.ok) {
      setError(result.error);
      setAvatarLoading(false);
      return;
    }

    setAvatarUrl(result.url);
    flashSuccess("Profile photo updated.");
    router.refresh();
    setAvatarLoading(false);
    event.target.value = "";
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setCoverLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadPortalCover(formData);

    if (!result.ok) {
      setError(result.error);
      setCoverLoading(false);
      return;
    }

    setCoverUrl(result.url);
    flashSuccess("Cover photo updated.");
    router.refresh();
    setCoverLoading(false);
    event.target.value = "";
  }

  async function handleRemoveAvatar() {
    if (!confirm("Remove your profile photo?")) return;
    const result = await removePortalAvatar();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAvatarUrl(undefined);
    flashSuccess("Profile photo removed.");
    router.refresh();
  }

  async function handleRemoveCover() {
    if (!confirm("Remove your cover photo?")) return;
    const result = await removePortalCover();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCoverUrl(undefined);
    flashSuccess("Cover photo removed.");
    router.refresh();
  }

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {success}
          </p>
        ) : null}

        <Card className="yazz-surface">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          <CardDescription>
            Profile photo and cover banner — shown on your public portal. JPG, PNG, WebP, or GIF up to 5 MB.
            {typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (
              <span className="block mt-1 text-xs text-amber-600">
                Dev Tip: If upload fails with &ldquo;bucket not found&rdquo;, run <code className="text-xs font-mono bg-amber-50 px-1">supabase/setup_storage_buckets.sql</code> in Supabase SQL Editor.
              </span>
            )}
          </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-medium">Profile photo</p>
              <div className="flex items-center gap-4">
                <Avatar className="size-20 border-2 border-border">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                  <AvatarFallback className="bg-primary/10 font-heading text-lg text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
                      {avatarLoading ? "Uploading…" : "Upload photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={avatarLoading}
                      onChange={handleAvatarUpload}
                    />
                  </label>
                  {avatarUrl ? (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar}>
                      <Trash2 className="size-3.5" data-icon="inline-start" />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Cover banner</p>
              <div
                className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 bg-cover bg-center"
                style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
              >
                {!coverUrl ? (
                  <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
                ) : null}
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
                    {coverLoading ? "Uploading…" : "Upload cover"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={coverLoading}
                    onChange={handleCoverUpload}
                  />
                </label>
                {coverUrl ? (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCover}>
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="yazz-surface">
          <CardHeader>
            <CardTitle>Your style & welcome</CardTitle>
            <CardDescription>
              A personal welcome for parents and an accent colour on your booking page — your
              &ldquo;swing&rdquo; on top of the standard layout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveStyle} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="portal-welcome" className="text-sm font-medium">
                  Welcome message
                </label>
                <textarea
                  id="portal-welcome"
                  rows={3}
                  value={portalWelcomeMessage}
                  onChange={(e) => setPortalWelcomeMessage(e.target.value)}
                  placeholder="Welcome to my teaching portal — book a lesson or browse revision packs below."
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <p className="text-xs text-muted-foreground">
                  Shown prominently under your photo. Ask parents to join your group first.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="portal-accent" className="text-sm font-medium">
                  Accent colour
                </label>
                <select
                  id="portal-accent"
                  value={accentPresetId}
                  onChange={(e) => setAccentPresetId(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {PORTAL_ACCENT_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="outline" disabled={styleLoading}>
                {styleLoading ? "Saving…" : "Save style"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="yazz-surface">
          <CardHeader>
            <CardTitle>Portal link</CardTitle>
            <CardDescription>
              Your private booking URL. Changing this updates the link you share with parents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveUsername} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex flex-1 items-center rounded-lg border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
                    <span className="shrink-0">{TUTOR_PUBLIC_PATH}/</span>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(slugifyUsername(e.target.value))}
                      className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={usernameLoading}>
                    {usernameLoading ? "Saving…" : "Update link"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Preview:{" "}
                  <code className="text-foreground">{portalPreview}</code>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="yazz-surface">
          <CardHeader>
            <CardTitle>Profile & pricing</CardTitle>
            <CardDescription>
              Name, bio, headline, and lesson rate shown on your public portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="display-name" className="text-sm font-medium">
                    Display name
                  </label>
                  <Input
                    id="display-name"
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
                    placeholder="GCSE Maths · calm sessions"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell parents about your teaching style…"
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="lesson-price" className="text-sm font-medium">
                    Lesson rate
                  </label>
                  <Input
                    id="lesson-price"
                    required
                    value={lessonPrice}
                    onChange={(e) => setLessonPrice(e.target.value)}
                    inputMode="decimal"
                    placeholder="45.00"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="currency" className="text-sm font-medium">
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {SUPPORTED_CURRENCIES.map((code) => (
                      <option key={code} value={code}>
                        {code.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-2 pb-2">
                <input
                  id="allow-public-joining"
                  type="checkbox"
                  checked={allowPublicJoining}
                  onChange={(e) => setAllowPublicJoining(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label htmlFor="allow-public-joining" className="text-sm font-semibold text-foreground cursor-pointer">
                    Allow families to self-join via public page
                  </label>
                  <p className="text-xs text-muted-foreground leading-normal">
                    When enabled, the &ldquo;Join Family&rdquo; form is shown on your public booking page. 
                    Disable this to make your portal invite-only and prevent unauthorized self-signups.
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="yazz-surface">
          <CardHeader>
            <CardTitle>Lesson block package</CardTitle>
            <CardDescription>
              Allow parents to purchase lesson credits upfront in bulk. Configure the lessons count and a discount using the sliders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePackage} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <label htmlFor="lessons-count-slider">Package size</label>
                    <span className="text-primary font-bold text-base">{blockLessonsCount} Lessons</span>
                  </div>
                  <input
                    id="lessons-count-slider"
                    type="range"
                    min="2"
                    max="20"
                    step="1"
                    value={blockLessonsCount}
                    onChange={(e) => setBlockLessonsCount(parseInt(e.target.value, 10))}
                    className="w-full h-2 rounded-lg bg-muted appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Define how many lessons are included in a bulk credit package.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <label htmlFor="discount-slider">Bulk discount</label>
                    <span className="text-primary font-bold text-base">{blockDiscountPercent}% Off</span>
                  </div>
                  <input
                    id="discount-slider"
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={blockDiscountPercent}
                    onChange={(e) => setBlockDiscountPercent(parseInt(e.target.value, 10))}
                    className="w-full h-2 rounded-lg bg-muted appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deduct a discount percentage to make purchasing credits more appealing.
                  </p>
                </div>

                {/* Show pricing summary mathematically */}
                <div className="rounded-xl border border-border/70 bg-muted/25 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Standard rate:</span>
                    <span className="font-medium">
                      {((previewProfile.lessonPriceCents * blockLessonsCount) / 100).toFixed(2)} {previewProfile.currency.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount saving:</span>
                    <span>
                      -{(
                        (previewProfile.lessonPriceCents *
                          blockLessonsCount *
                          (blockDiscountPercent / 100)) /
                        100
                      ).toFixed(2)}{" "}
                      {previewProfile.currency.toUpperCase()}
                    </span>
                  </div>
                  <div className="border-t border-border/60 pt-2 flex justify-between text-base font-bold">
                    <span>Package price:</span>
                    <span className="text-primary">
                      {(
                        (previewProfile.lessonPriceCents *
                          blockLessonsCount *
                          (1 - blockDiscountPercent / 100)) /
                        100
                      ).toFixed(2)}{" "}
                      {previewProfile.currency.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={packageLoading}>
                {packageLoading ? "Saving…" : "Save package limits"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Live preview</h2>
          <Button variant="outline" size="sm" render={<Link href={`/tutor/${profile.username}`} target="_blank" />}>
            Open portal
            <ExternalLink className="size-3.5" data-icon="inline-end" />
          </Button>
        </div>
        <PortalThemeWrapper tutor={previewProfile}>
          <PublicProfile tutor={previewProfile} />
        </PortalThemeWrapper>
      </div>
    </div>
  );
}
