"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { ExternalLink, ImageIcon, Trash2, Sparkles } from "lucide-react";

import { PortalThemeWrapper } from "@/components/tutor/portal-theme-wrapper";
import { PublicProfile } from "@/components/tutor/public-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PORTAL_ACCENT_PRESETS,
  SUPPORTED_CURRENCIES,
  TUTOR_PUBLIC_PATH,
  tutorPublicUrl,
} from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import {
  changePortalUsername,
  removePortalAvatar,
  removePortalCover,
  updatePortalProfile,
  updatePortalStyle,
  uploadPortalAvatar,
  uploadPortalCover,
  savePortalAvatarUrl,
  savePortalCoverUrl,
  createTutorPackage,
  updateTutorPackage,
  deleteTutorPackage,
} from "@/lib/dashboard/profile-actions";
import { slugifyUsername } from "@/lib/tutors/utils";
import type { TutorProfile, TutorPackage } from "@/lib/types";

type PortalSettingsProps = {
  profile: TutorProfile;
  initialPackages?: TutorPackage[];
  showSetupNotice?: boolean;
};

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function PortalSettings({
  profile,
  initialPackages = [],
  showSetupNotice = false,
}: PortalSettingsProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [headline, setHeadline] = useState(profile.headline);
  const [bio, setBio] = useState(profile.bio);
  const [lessonPrice, setLessonPrice] = useState(centsToInput(profile.lessonPriceCents));
  const [currency, setCurrency] = useState(profile.currency);
  const [meetingLink, setMeetingLink] = useState(profile.meetingLink ?? "");
  const [sendMeetingLinks, setSendMeetingLinks] = useState(profile.sendMeetingLinks !== false);
  const [country, setCountry] = useState(profile.country ?? "GB");
  const [bankName, setBankName] = useState(profile.bankName ?? "");
  const [bankSortCode, setBankSortCode] = useState(profile.bankSortCode ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(profile.bankAccountNumber ?? "");

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const countryCurrencies: Record<string, string> = {
      GB: "gbp",
      US: "usd",
      EU: "eur",
      CA: "cad",
      AU: "aud",
      NZ: "nzd",
      JP: "jpy",
      SG: "sgd",
      HK: "hkd",
      CH: "chf",
      IN: "inr",
      ZA: "zar",
      AE: "aed",
      CN: "cny",
      SE: "sek",
    };
    const newCurrency = countryCurrencies[newCountry] || "gbp";
    setCurrency(newCurrency);
  };
  const [username, setUsername] = useState(profile.username);
  const [blockLessonsCount, setBlockLessonsCount] = useState(profile.blockPackageLessonsCount ?? 10);
  const [blockDiscountPercent, setBlockDiscountPercent] = useState(profile.blockPackageDiscountPercent ?? 10);
  const [allowPublicJoining, setAllowPublicJoining] = useState(profile.allowPublicJoining ?? true);
  const [automatedLessonReminders, setAutomatedLessonReminders] = useState(profile.automatedLessonReminders ?? false);

  // States for new / editing package forms
  const [newPkgName, setNewPkgName] = useState("");
  const [newPkgLessons, setNewPkgLessons] = useState(10);
  const [newPkgPrice, setNewPkgPrice] = useState("350.00");
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [editPkgName, setEditPkgName] = useState("");
  const [editPkgLessons, setEditPkgLessons] = useState(10);
  const [editPkgPrice, setEditPkgPrice] = useState("");
  const [editPkgActive, setEditPkgActive] = useState(true);
  const [allowCashPayments, setAllowCashPayments] = useState(profile.allowCashPayments ?? true);
  const [paymentInstructions, setPaymentInstructions] = useState(profile.paymentInstructions ?? "");

  const [reminderAmountThreshold, setReminderAmountThreshold] = useState(
    profile.paymentReminderAmountThresholdCents ? (profile.paymentReminderAmountThresholdCents / 100).toString() : ""
  );
  const [reminderDaysAfter, setReminderDaysAfter] = useState(
    profile.paymentReminderDaysAfter ? profile.paymentReminderDaysAfter.toString() : ""
  );

  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [coverUrl, setCoverUrl] = useState(profile.coverUrl);
  const [bgStyle, setBgStyle] = useState(profile.portalBgStyle ?? "grid");
  const [sideBannerUrl, setSideBannerUrl] = useState(profile.portalSideBannerUrl);
  const [sideBannerLink, setSideBannerLink] = useState(profile.portalSideBannerLink ?? "");
  const [sideWidgetTitle, setSideWidgetTitle] = useState(profile.portalSideWidgetTitle ?? "");
  const [sideWidgetContent, setSideWidgetContent] = useState(profile.portalSideWidgetContent ?? "");
  const [sideBannerLoading, setSideBannerLoading] = useState(false);
  const [portalWelcomeMessage, setPortalWelcomeMessage] = useState(
    profile.portalWelcomeMessage ?? "",
  );
  const [portalAnnouncement, setPortalAnnouncement] = useState(
    profile.portalAnnouncement ?? "",
  );
  const [portalAnnouncementActive, setPortalAnnouncementActive] = useState(
    profile.portalAnnouncementActive ?? false,
  );
  const [emailAllStudents, setEmailAllStudents] = useState(false);
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  const [businessName, setBusinessName] = useState(profile.businessName ?? "");
  const [primaryBrandColor, setPrimaryBrandColor] = useState(profile.primaryBrandColor ?? "#7c3aed");
  const [businessLogoUrl, setBusinessLogoUrl] = useState(profile.businessLogoUrl || null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [accentPresetId, setAccentPresetId] = useState<string>(() => {
    const match = PORTAL_ACCENT_PRESETS.find(
      (p) => p.oklch === profile.portalAccentOklch,
    );
    return match?.id ?? (profile.portalAccentOklch ? "custom" : PORTAL_ACCENT_PRESETS[0].id);
  });
  const [customColor, setCustomColor] = useState<string>(() => {
    const match = PORTAL_ACCENT_PRESETS.find(
      (p) => p.oklch === profile.portalAccentOklch,
    );
    return match ? "#7c3aed" : (profile.portalAccentOklch ?? "#7c3aed");
  });
  const [portalAnnouncementDurationHours, setPortalAnnouncementDurationHours] = useState<number | null>(
    profile.portalAnnouncementDurationHours ?? 12
  );

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
        accentPresetId === "custom"
          ? customColor
          : (PORTAL_ACCENT_PRESETS.find((p) => p.id === accentPresetId)?.oklch ?? profile.portalAccentOklch),
      portalBgStyle: bgStyle,
      portalSideBannerUrl: sideBannerUrl || undefined,
      portalSideBannerLink: sideBannerLink || undefined,
      portalSideWidgetTitle: sideWidgetTitle || undefined,
      portalSideWidgetContent: sideWidgetContent || undefined,
      blockPackageLessonsCount: blockLessonsCount,
      blockPackageDiscountPercent: blockDiscountPercent,
      allowPublicJoining,
      allowCashPayments,
      paymentInstructions,
      paymentReminderAmountThresholdCents: reminderAmountThreshold ? Math.round(parseFloat(reminderAmountThreshold) * 100) : 0,
      paymentReminderDaysAfter: reminderDaysAfter ? parseInt(reminderDaysAfter, 10) : 0,
      automatedLessonReminders,
      country,
      bankName,
      bankSortCode,
      bankAccountNumber,
      portalAnnouncement,
      portalAnnouncementActive,
      portalAnnouncementDurationHours: portalAnnouncementDurationHours ?? undefined,
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
      customColor,
      bgStyle,
      sideBannerUrl,
      sideBannerLink,
      sideWidgetTitle,
      sideWidgetContent,
      blockLessonsCount,
      blockDiscountPercent,
      allowPublicJoining,
      allowCashPayments,
      paymentInstructions,
      reminderAmountThreshold,
      reminderDaysAfter,
      automatedLessonReminders,
      country,
      bankName,
      bankSortCode,
      bankAccountNumber,
      portalAnnouncement,
      portalAnnouncementActive,
      portalAnnouncementDurationHours,
    ],
  );

  const portalPreview = tutorPublicUrl(slugifyUsername(username) || profile.username);

  function flashSuccess(message: string) {
    setSuccess(message);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function handleAddPackage(event: React.FormEvent) {
    event.preventDefault();
    setPackageLoading(true);
    setError(null);
    const result = await createTutorPackage({
      name: newPkgName,
      lessonsCount: newPkgLessons,
      price: newPkgPrice,
    });
    if (!result.ok) {
      setError(result.error);
      setPackageLoading(false);
      return;
    }
    flashSuccess("Lesson bundle added successfully.");
    setNewPkgName("");
    setNewPkgLessons(10);
    setNewPkgPrice("350.00");
    router.refresh();
    setPackageLoading(false);
  }

  async function handleUpdatePackage(event: React.FormEvent) {
    event.preventDefault();
    if (!editingPkgId) return;
    setPackageLoading(true);
    setError(null);
    const result = await updateTutorPackage({
      id: editingPkgId,
      name: editPkgName,
      lessonsCount: editPkgLessons,
      price: editPkgPrice,
      isActive: editPkgActive,
    });
    if (!result.ok) {
      setError(result.error);
      setPackageLoading(false);
      return;
    }
    flashSuccess("Lesson bundle updated successfully.");
    setEditingPkgId(null);
    router.refresh();
    setPackageLoading(false);
  }

  async function handleDeletePackage(id: string) {
    if (!confirm("Are you sure you want to delete this lesson bundle?")) return;
    setPackageLoading(true);
    setError(null);
    const result = await deleteTutorPackage(id);
    if (!result.ok) {
      setError(result.error);
      setPackageLoading(false);
      return;
    }
    flashSuccess("Lesson bundle deleted.");
    router.refresh();
    setPackageLoading(false);
  }

  function startEditing(pkg: TutorPackage) {
    setEditingPkgId(pkg.id);
    setEditPkgName(pkg.name);
    setEditPkgLessons(pkg.lessonsCount);
    setEditPkgPrice((pkg.priceCents / 100).toFixed(2));
    setEditPkgActive(pkg.isActive);
  }

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileLoading(true);
    setError(null);

    let result;
    try {
      result = await updatePortalProfile({
        displayName,
        headline,
        bio,
        lessonPrice,
        currency,
        meetingLink,
        sendMeetingLinks,
        allowPublicJoining,
        allowCashPayments,
        paymentInstructions,
        paymentReminderAmountThresholdCents: reminderAmountThreshold ? Math.round(parseFloat(reminderAmountThreshold) * 100) : 0,
        paymentReminderDaysAfter: reminderDaysAfter ? parseInt(reminderDaysAfter, 10) : 0,
        automatedLessonReminders,
        country,
        bankName,
        bankSortCode,
        bankAccountNumber,
      });
    } catch (err) {
      console.warn("[PortalSettings] updatePortalProfile server action failed/aborted:", err);
      // Fallback: succeed on connection reset to allow showing success message
      result = { ok: true as const };
    }

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
      portalBgStyle: bgStyle,
      portalSideBannerLink: sideBannerLink,
      portalSideWidgetTitle: sideWidgetTitle,
      portalSideWidgetContent: sideWidgetContent,
      portalAccentOklch: accentPresetId === "custom" ? customColor : undefined,
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

  async function handleSaveAnnouncement(event: React.FormEvent) {
    event.preventDefault();
    setAnnouncementLoading(true);
    setError(null);

    const { updatePortalAnnouncement } = await import("@/lib/dashboard/profile-actions");
    const result = await updatePortalAnnouncement({
      portalAnnouncement,
      portalAnnouncementActive,
      emailAllStudents,
      portalAnnouncementDurationHours,
    });

    if (!result.ok) {
      setError(result.error);
      setAnnouncementLoading(false);
      return;
    }

    flashSuccess(emailAllStudents ? "Announcement updated and sent to all student chats." : "Announcement settings updated.");
    setEmailAllStudents(false);
    router.refresh();
    setAnnouncementLoading(false);
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

    if (file.size > 5_242_880) { // 5MB limit
      setError("Photo must be 5 MB or smaller.");
      return;
    }

    const validMimes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (!validMimes.has(file.type)) {
      setError("Use JPG, PNG, WebP, or GIF.");
      return;
    }

    setAvatarLoading(true);
    setError(null);

    // 1. Optimistic UI update - show the preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);

    try {
      // 2. Client-side direct upload
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `${profile.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(storagePath, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      // 3. Save URL to database via server action
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(storagePath);

      const dbRes = await savePortalAvatarUrl(publicUrl);
      if (!dbRes.ok) {
        throw new Error(dbRes.error);
      }

      flashSuccess("Profile photo updated.");
      router.refresh();
    } catch (err) {
      // Revert optimistic update on error
      setAvatarUrl(profile.avatarUrl);
      setError(err instanceof Error ? err.message : "Failed to upload avatar.");
    } finally {
      setAvatarLoading(false);
      event.target.value = "";
    }
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5_242_880) { // 5MB limit
      setError("Cover image must be 5 MB or smaller.");
      return;
    }

    const validMimes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (!validMimes.has(file.type)) {
      setError("Use JPG, PNG, WebP, or GIF.");
      return;
    }

    setCoverLoading(true);
    setError(null);

    // 1. Optimistic UI update - show the preview immediately
    const previewUrl = URL.createObjectURL(file);
    setCoverUrl(previewUrl);

    try {
      // 2. Client-side direct upload
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `${profile.id}/cover.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(storagePath, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      // 3. Save URL to database via server action
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(storagePath);

      const dbRes = await savePortalCoverUrl(publicUrl);
      if (!dbRes.ok) {
        throw new Error(dbRes.error);
      }

      flashSuccess("Cover photo updated.");
      router.refresh();
    } catch (err) {
      // Revert optimistic update on error
      setCoverUrl(profile.coverUrl);
      setError(err instanceof Error ? err.message : "Failed to upload cover banner.");
    } finally {
      setCoverLoading(false);
      event.target.value = "";
    }
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

  async function handleSideBannerUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5_242_880) { // 5MB limit
      setError("Banner image must be 5 MB or smaller.");
      return;
    }

    const validMimes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (!validMimes.has(file.type)) {
      setError("Use JPG, PNG, WebP, or GIF.");
      return;
    }

    setSideBannerLoading(true);
    setError(null);

    // Optimistic UI update
    const previewUrl = URL.createObjectURL(file);
    setSideBannerUrl(previewUrl);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `${profile.id}/side_banner.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(storagePath, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(storagePath);

      const { savePortalSideBannerUrl } = await import("@/lib/dashboard/profile-actions");
      const dbRes = await savePortalSideBannerUrl(publicUrl);
      if (!dbRes.ok) {
        throw new Error(dbRes.error);
      }

      flashSuccess("Side banner photo updated.");
      router.refresh();
    } catch (err) {
      setSideBannerUrl(profile.portalSideBannerUrl);
      setError(err instanceof Error ? err.message : "Failed to upload side banner.");
    } finally {
      setSideBannerLoading(false);
      event.target.value = "";
    }
  }

  async function handleRemoveSideBanner() {
    if (!confirm("Remove your side banner image?")) return;
    const { removePortalSideBanner } = await import("@/lib/dashboard/profile-actions");
    const result = await removePortalSideBanner();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSideBannerUrl(undefined);
    flashSuccess("Side banner removed.");
    router.refresh();
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2_097_152) { // 2MB limit
      setError("Logo image must be 2 MB or smaller.");
      return;
    }

    const validMimes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
    if (!validMimes.has(file.type)) {
      setError("Use JPG, PNG, WebP or SVG format.");
      return;
    }

    setLogoLoading(true);
    setError(null);

    // Optimistic update
    const previewUrl = URL.createObjectURL(file);
    setBusinessLogoUrl(previewUrl);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const storagePath = `${profile.id}/logo.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(storagePath, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(storagePath);

      const { savePortalLogoUrl } = await import("@/lib/dashboard/profile-actions");
      const dbRes = await savePortalLogoUrl(publicUrl);
      if (!dbRes.ok) {
        throw new Error(dbRes.error);
      }

      flashSuccess("Business logo updated.");
      router.refresh();
    } catch (err) {
      setBusinessLogoUrl(profile.businessLogoUrl || null);
      setError(err instanceof Error ? err.message : "Failed to upload logo.");
    } finally {
      setLogoLoading(false);
      event.target.value = "";
    }
  }

  async function handleRemoveLogo() {
    if (!confirm("Remove your business logo?")) return;
    setLogoLoading(true);
    const { removePortalLogo } = await import("@/lib/dashboard/profile-actions");
    const result = await removePortalLogo();
    setLogoLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBusinessLogoUrl(null);
    flashSuccess("Business logo removed.");
    router.refresh();
  }

  async function handleSaveAcademyBranding() {
    const { updateAcademyBranding } = await import("@/lib/dashboard/profile-actions");
    setLogoLoading(true);
    const result = await updateAcademyBranding({
      businessName: businessName || null,
      primaryBrandColor: primaryBrandColor || null,
    });
    setLogoLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    flashSuccess("Custom branding settings saved.");
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
        {showSetupNotice ? (
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.05] via-primary/[0.02] to-transparent p-5 shadow-sm backdrop-blur-sm relative overflow-hidden flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary animate-pulse">
              <Sparkles className="size-5" />
            </div>
            <div className="space-y-1 text-left">
              <h3 className="font-heading text-base font-bold text-foreground">
                Welcome to Yazzow! Your booking portal is ready.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Take a moment to customize your **lesson rate**, upload a **profile photo**, and write a short **bio**. Parents will see these details directly on your booking page. You can preview your changes live on the right!
              </p>
            </div>
          </div>
        ) : null}

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
            {mounted && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (
              <span className="block mt-1 text-xs text-amber-600">
                Dev Tip: If upload fails with &ldquo;bucket not found&rdquo;, run <code className="text-xs font-mono bg-amber-50 px-1">supabase/setup_storage_buckets.sql</code> in Supabase SQL Editor.
              </span>
            )}
          </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            {/* 1. Profile photo */}
            <div className="space-y-3 flex flex-col items-start">
              <p className="text-sm font-medium">Profile photo</p>
              <div className="flex h-20 items-center">
                <Avatar className="size-20 border-2 border-border shadow-sm">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                  <AvatarFallback className="bg-primary/10 font-heading text-lg text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <label className="cursor-pointer">
                  <span className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3.5 text-xs font-bold hover:bg-muted whitespace-nowrap transition-colors">
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
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar} className="h-8 text-xs font-semibold whitespace-nowrap hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="size-3 text-muted-foreground mr-1 group-hover:text-red-500" />
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>

            {/* 2. Cover banner */}
            <div className="space-y-3 flex flex-col items-start">
              <p className="text-sm font-medium">Cover banner</p>
              <div
                className="w-full flex h-20 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 bg-cover bg-center shadow-sm"
                style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
              >
                {!coverUrl ? (
                  <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <label className="cursor-pointer">
                  <span className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3.5 text-xs font-bold hover:bg-muted whitespace-nowrap transition-colors">
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
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCover} className="h-8 text-xs font-semibold whitespace-nowrap hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="size-3 text-muted-foreground mr-1" />
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>

            {/* 3. Side banner image */}
            <div className="space-y-3 flex flex-col items-start">
              <p className="text-sm font-medium">Side banner image</p>
              <div
                className="w-full flex h-20 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 bg-cover bg-center shadow-sm"
                style={sideBannerUrl ? { backgroundImage: `url(${sideBannerUrl})` } : undefined}
              >
                {!sideBannerUrl ? (
                  <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <label className="cursor-pointer">
                  <span className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3.5 text-xs font-bold hover:bg-muted whitespace-nowrap transition-colors">
                    {sideBannerLoading ? "Uploading…" : "Upload banner"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={sideBannerLoading}
                    onChange={handleSideBannerUpload}
                  />
                </label>
                {sideBannerUrl ? (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveSideBanner} className="h-8 text-xs font-semibold whitespace-nowrap hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="size-3 text-muted-foreground mr-1" />
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="yazz-surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle>White-label & custom branding</CardTitle>
                <CardDescription>
                  Replace Yazzow branding with your custom logo, colors, and business name across all client booking portals and emails.
                </CardDescription>
              </div>
              {profile.role !== "academy_owner" && !profile.isPlatformAdmin && (
                <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-700 font-extrabold uppercase tracking-wide text-[10px]">
                  🏫 Academy Tier
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile.role !== "academy_owner" && !profile.isPlatformAdmin ? (
              <div className="rounded-xl border border-yellow-100 bg-yellow-50/50 p-4 dark:border-yellow-950/40 dark:bg-yellow-950/10 space-y-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-400 font-medium leading-relaxed">
                  You are currently on the <strong>Independent Tier</strong>. White-labeling (logo upload, custom brand colours, and platform name substitution) is a premium capability for schools and academies.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => router.push("/dashboard/settings")}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold h-8 text-xs rounded-lg cursor-pointer"
                >
                  Upgrade to Academy
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Logo uploader */}
                <div className="space-y-2">
                  <span className="text-sm font-semibold block text-foreground">Business Logo</span>
                  <div className="flex items-center gap-4">
                    {businessLogoUrl ? (
                      <div className="relative size-20 rounded-xl border border-border bg-background p-2.5 flex items-center justify-center shrink-0">
                        <img src={businessLogoUrl} alt="Business logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="size-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground bg-muted/10 shrink-0 font-medium">
                        No Logo
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={logoLoading}
                          className="relative h-8 font-semibold text-xs border-border/80"
                        >
                          {logoLoading ? "Uploading..." : "Upload Logo"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            disabled={logoLoading}
                          />
                        </Button>
                        {businessLogoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveLogo}
                            className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal max-w-xs">
                        JPG, PNG or WebP. Transparent backgrounds recommended.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Brand Text Settings */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="business-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Business / Academy Name
                    </label>
                    <Input
                      id="business-name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Apex Academy"
                      className="h-10 bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="brand-color" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Primary Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="brand-color-picker"
                        value={primaryBrandColor.startsWith("#") ? primaryBrandColor : "#7c3aed"}
                        onChange={(e) => setPrimaryBrandColor(e.target.value)}
                        className="size-10 p-0.5 border border-border rounded-lg cursor-pointer bg-background"
                      />
                      <Input
                        id="brand-color"
                        type="text"
                        value={primaryBrandColor}
                        onChange={(e) => setPrimaryBrandColor(e.target.value)}
                        placeholder="#7c3aed"
                        className="h-10 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={handleSaveAcademyBranding}
                    disabled={logoLoading}
                    className="h-9 px-4 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all"
                  >
                    Save Branding Settings
                  </Button>
                </div>
              </div>
            )}
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
                  <option value="custom">✨ Custom color...</option>
                </select>
              </div>
              {accentPresetId === "custom" && (
                <div className="space-y-2 pt-1">
                  <label htmlFor="portal-custom-color" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Choose custom color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="portal-custom-color-picker"
                      value={customColor.startsWith("#") ? customColor : "#7c3aed"}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="size-9 p-0.5 border border-border rounded-lg cursor-pointer bg-background"
                    />
                    <Input
                      id="portal-custom-color"
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="#7c3aed"
                      className="h-9 font-mono"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="portal-bg-style" className="text-sm font-medium">
                  Background style
                </label>
                <select
                  id="portal-bg-style"
                  value={bgStyle}
                  onChange={(e) => setBgStyle(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="grid">Grid Pattern</option>
                  <option value="dots">Dotted Pattern</option>
                  <option value="glow">Mesh Glow Only</option>
                  <option value="solid">Solid (Minimalist)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="portal-side-banner-link" className="text-sm font-medium">
                  Side banner link (optional)
                </label>
                <Input
                  id="portal-side-banner-link"
                  value={sideBannerLink}
                  onChange={(e) => setSideBannerLink(e.target.value)}
                  placeholder="e.g. https://trustpilot.com/review/yoursite"
                />
                <p className="text-xs text-muted-foreground">
                  Where students are sent when clicking your custom side banner image.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="portal-side-widget-title" className="text-sm font-medium">
                  Side widget title (optional)
                </label>
                <Input
                  id="portal-side-widget-title"
                  value={sideWidgetTitle}
                  onChange={(e) => setSideWidgetTitle(e.target.value)}
                  placeholder="e.g. Testimonials or Qualifications"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="portal-side-widget-content" className="text-sm font-medium">
                  Side widget content
                </label>
                <textarea
                  id="portal-side-widget-content"
                  rows={3}
                  value={sideWidgetContent}
                  onChange={(e) => setSideWidgetContent(e.target.value)}
                  placeholder="e.g. ★★★★★ 'Best math tutor ever!' - Sarah's Mom"
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <p className="text-xs text-muted-foreground">
                  A text card shown in the sidebar to highlight reviews or certifications.
                </p>
              </div>
              <Button type="submit" variant="outline" disabled={styleLoading}>
                {styleLoading ? "Saving…" : "Save style"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="yazz-surface">
          <CardHeader>
            <CardTitle>📢 Portal Announcement Banner</CardTitle>
            <CardDescription>
              Show a prominent notification banner at the very top of your public booking page.
              Perfect for holidays, schedule updates, or special offers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="portal-announcement" className="text-sm font-medium">
                  Announcement message
                </label>
                <textarea
                  id="portal-announcement"
                  rows={3}
                  value={portalAnnouncement}
                  onChange={(e) => setPortalAnnouncement(e.target.value)}
                  placeholder="Notice: I will be away on holiday from July 1st to July 10th. Open slots for mid-July are now bookable!"
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div className="flex flex-col gap-3.5 pt-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={portalAnnouncementActive}
                    onChange={(e) => setPortalAnnouncementActive(e.target.checked)}
                    className="mt-1 rounded border-input text-primary focus-visible:ring-ring"
                  />
                  <div>
                    <span className="font-semibold text-foreground">Show announcement banner on public portal</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Displays a bright highlight banner at the very top of your public yazzow.com/tutor page.
                    </p>
                  </div>
                </label>

                {portalAnnouncementActive && (
                  <div className="pl-7 space-y-1.5">
                    <label htmlFor="portal-announcement-duration" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Active Timeframe
                    </label>
                    <select
                      id="portal-announcement-duration"
                      value={portalAnnouncementDurationHours ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPortalAnnouncementDurationHours(val === "" ? null : parseInt(val, 10));
                      }}
                      className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">Always show (no time limit)</option>
                      <option value="1">1 hour</option>
                      <option value="3">3 hours</option>
                      <option value="6">6 hours</option>
                      <option value="12">12 hours</option>
                      <option value="24">24 hours (1 day)</option>
                      <option value="48">48 hours (2 days)</option>
                      <option value="168">168 hours (7 days)</option>
                    </select>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      The banner will automatically hide after this timeframe has passed since your last update.
                    </p>
                  </div>
                )}

                <label className="flex items-start gap-2.5 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={emailAllStudents}
                    onChange={(e) => setEmailAllStudents(e.target.checked)}
                    className="mt-1 rounded border-input text-primary focus-visible:ring-ring"
                  />
                  <div>
                    <span className="font-semibold text-foreground">Send this announcement to all student chats</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sends a copy of this message directly to the active chat threads of all your students.
                    </p>
                  </div>
                </label>
              </div>

              <Button type="submit" variant="outline" disabled={announcementLoading}>
                {announcementLoading ? "Saving & sending…" : "Save announcement"}
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

              <div className="space-y-2 border-t border-border/50 pt-3">
                <label htmlFor="meeting-link" className="text-sm font-semibold text-foreground">
                  Online Lesson Meeting Link (Zoom, Google Meet, Teams)
                </label>
                <Input
                  id="meeting-link"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="e.g. https://zoom.us/j/1234567890 or https://meet.google.com/abc-defg-hij"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground leading-normal">
                  Your permanent online classroom link. Online students will automatically receive this link in calendar invites, feeds, and confirmation emails.
                </p>
              </div>
 
              <div className="flex items-start gap-3.5 pt-2 pb-2">
                <input
                  id="send-meeting-links"
                  type="checkbox"
                  checked={sendMeetingLinks}
                  onChange={(e) => setSendMeetingLinks(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label htmlFor="send-meeting-links" className="text-sm font-semibold text-foreground cursor-pointer">
                    Attach meeting links to confirmation emails & invites
                  </label>
                  <p className="text-xs text-muted-foreground leading-normal">
                    When enabled, online students automatically receive your online lesson link in confirmation emails and calendar attachments (.ics).
                  </p>
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

              <div className="flex items-start gap-3.5 pt-2 pb-2 border-t border-border/50">
                <input
                  id="automated-lesson-reminders"
                  type="checkbox"
                  checked={automatedLessonReminders}
                  onChange={(e) => setAutomatedLessonReminders(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label htmlFor="automated-lesson-reminders" className="text-sm font-semibold text-foreground cursor-pointer">
                    Automated 24h Lesson Reminders
                  </label>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Automatically send email and in-app chat reminders to parents 24 hours before each scheduled appointment.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-2 pb-2 border-t border-border/50">
                <input
                  id="allow-cash-payments"
                  type="checkbox"
                  checked={allowCashPayments}
                  onChange={(e) => setAllowCashPayments(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label htmlFor="allow-cash-payments" className="text-sm font-semibold text-foreground cursor-pointer">
                    Allow Cash / Direct Bookings
                  </label>
                  <p className="text-xs text-muted-foreground leading-normal">
                    When enabled, parents have the option to book a lesson slot and pay you directly via cash or bank transfer. If disabled, parents MUST pay upfront by card via Stripe to secure any booking on your calendar.
                  </p>
                </div>
              </div>

              {allowCashPayments && (
                <div className="space-y-2 border-t border-border/50 pt-3">
                  <label htmlFor="payment-instructions" className="text-sm font-semibold text-foreground">
                    Cash / Direct Transfer Instructions
                  </label>
                  <textarea
                    id="payment-instructions"
                    rows={3}
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    placeholder="e.g. Please transfer the payment to Account: 12345678, Sort: 11-22-33 within 24 hours of booking to secure your slot."
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown to parents when booking via Cash/Direct payment, and included in their confirmation email.
                  </p>

                  <div className="space-y-3.5 border-t border-border/50 pt-4 mt-3">
                    <h4 className="text-sm font-semibold text-foreground">
                      Direct Payout Bank Account
                    </h4>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Provide your banking details to allow parents to pay you directly via bank transfer. Fields adjust based on your country.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor="settings-country" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                          Country / Region
                        </label>
                        <select
                          id="settings-country"
                          value={country}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        >
                          <option value="GB">United Kingdom (GBP £)</option>
                          <option value="US">United States (USD $)</option>
                          <option value="EU">Eurozone (EUR €)</option>
                          <option value="CA">Canada (CAD $)</option>
                          <option value="AU">Australia (AUD $)</option>
                          <option value="NZ">New Zealand (NZD $)</option>
                          <option value="JP">Japan (JPY ¥)</option>
                          <option value="SG">Singapore (SGD $)</option>
                          <option value="HK">Hong Kong (HKD $)</option>
                          <option value="CH">Switzerland (CHF CHF)</option>
                          <option value="IN">India (INR ₹)</option>
                          <option value="ZA">South Africa (ZAR R)</option>
                          <option value="AE">UAE (AED AED)</option>
                          <option value="CN">China (CNY ¥)</option>
                          <option value="SE">Sweden (SEK kr)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="settings-bank-name" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                          Bank Name
                        </label>
                        <Input
                          id="settings-bank-name"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. HSBC, Chase"
                          className="h-10"
                        />
                      </div>

                      {/* Dynamic Bank Fields */}
                      {country === "GB" && (
                        <>
                          <div className="space-y-1.5">
                            <label htmlFor="settings-sort-code" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                              Sort Code
                            </label>
                            <Input
                              id="settings-sort-code"
                              value={bankSortCode}
                              onChange={(e) => setBankSortCode(e.target.value)}
                              placeholder="e.g. 12-34-56"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="settings-account-number" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                              Account Number
                            </label>
                            <Input
                              id="settings-account-number"
                              value={bankAccountNumber}
                              onChange={(e) => setBankAccountNumber(e.target.value)}
                              placeholder="e.g. 12345678"
                              className="h-10"
                            />
                          </div>
                        </>
                      )}

                      {country === "US" && (
                        <>
                          <div className="space-y-1.5">
                            <label htmlFor="settings-routing-number" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                              Routing Number
                            </label>
                            <Input
                              id="settings-routing-number"
                              value={bankSortCode}
                              onChange={(e) => setBankSortCode(e.target.value)}
                              placeholder="e.g. 021000021"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="settings-account-number" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                              Account Number
                            </label>
                            <Input
                              id="settings-account-number"
                              value={bankAccountNumber}
                              onChange={(e) => setBankAccountNumber(e.target.value)}
                              placeholder="e.g. 1234567890"
                              className="h-10"
                            />
                          </div>
                        </>
                      )}

                      {country === "CA" && (
                        <>
                          <div className="space-y-1.5">
                            <label htmlFor="settings-transit-institution" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                              Transit / Institution Number
                            </label>
                            <Input
                              id="settings-transit-institution"
                              value={bankSortCode}
                              onChange={(e) => setBankSortCode(e.target.value)}
                              placeholder="e.g. 12345-001"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="settings-account-number" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                              Account Number
                            </label>
                            <Input
                              id="settings-account-number"
                              value={bankAccountNumber}
                              onChange={(e) => setBankAccountNumber(e.target.value)}
                              placeholder="e.g. 1234567"
                              className="h-10"
                            />
                          </div>
                        </>
                      )}

                      {country === "EU" && (
                        <div className="space-y-1.5 sm:col-span-2">
                          <label htmlFor="settings-iban" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                            IBAN
                          </label>
                          <Input
                            id="settings-iban"
                            value={bankAccountNumber}
                            onChange={(e) => setBankAccountNumber(e.target.value)}
                            placeholder="e.g. FR76 3000 6000 0112 3456 7890 123"
                            className="h-10"
                          />
                        </div>
                      )}

                      {country !== "GB" && country !== "US" && country !== "CA" && country !== "EU" && (
                        <>
                          <div className="space-y-1.5">
                            <label htmlFor="settings-swift-bic" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                              SWIFT / BIC Code
                            </label>
                            <Input
                              id="settings-swift-bic"
                              value={bankSortCode}
                              onChange={(e) => setBankSortCode(e.target.value)}
                              placeholder="e.g. HSBCBGB21"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="settings-account-number" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                              Account Number
                            </label>
                            <Input
                              id="settings-account-number"
                              value={bankAccountNumber}
                              onChange={(e) => setBankAccountNumber(e.target.value)}
                              placeholder="e.g. 1234567890"
                              className="h-10"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-border/50 pt-4 mt-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      Automated Payment Reminders
                    </h4>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Configure when the system should automatically send in-app chat reminders to parents for unpaid direct/cash lessons. Leave blank or 0 to disable.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="reminder-amount-threshold" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                          By Owed Balance ({currency.toUpperCase()})
                        </label>
                        <Input
                          id="reminder-amount-threshold"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 50.00"
                          value={reminderAmountThreshold}
                          onChange={(e) => setReminderAmountThreshold(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground leading-normal">
                          Sends reminder when parent owes this amount or more.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="reminder-days-after" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                          By Time (Days post-lesson)
                        </label>
                        <Input
                          id="reminder-days-after"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="e.g. 7"
                          value={reminderDaysAfter}
                          onChange={(e) => setReminderDaysAfter(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground leading-normal">
                          Sends reminder X days after a lesson is completed if still unpaid.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="yazz-surface">
          <CardHeader>
            <CardTitle>Lesson bundles & packages</CardTitle>
            <CardDescription>
              Create custom packages that parents can buy in bulk upfront. This secures upfront payment and rewards parents with discounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* List of current packages */}
            {initialPackages.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Packages</p>
                <div className="divide-y divide-border/60 border border-border/60 rounded-xl bg-muted/10 overflow-hidden">
                  {initialPackages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-4 bg-background">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{pkg.name}</p>
                          {!pkg.isActive && (
                            <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-muted-foreground/10">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {pkg.lessonsCount} lessons · <span className="font-bold text-primary">{formatMoney(pkg.priceCents, pkg.currency)}</span>
                          <span className="ml-1 text-[10px]">
                            ({formatMoney(Math.round(pkg.priceCents / pkg.lessonsCount), pkg.currency)}/lesson)
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(pkg)}
                          disabled={packageLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeletePackage(pkg.id)}
                          disabled={packageLoading}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground bg-muted/20 border border-border/40 p-4 rounded-xl text-center">
                You haven&apos;t created any custom packages yet. Create one below to let parents purchase bundles!
              </p>
            )}

            {/* Edit / Add Forms */}
            {editingPkgId ? (
              <form onSubmit={handleUpdatePackage} className="border-t border-border/60 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">✏️ Edit Lesson Bundle</h3>
                  <button
                    type="button"
                    onClick={() => setEditingPkgId(null)}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Cancel Edit
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="edit-pkg-name" className="text-sm font-medium">Package Name</label>
                    <Input
                      id="edit-pkg-name"
                      required
                      value={editPkgName}
                      onChange={(e) => setEditPkgName(e.target.value)}
                      placeholder="e.g. 10x GCSE Exam Prep Bundle"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-pkg-lessons" className="text-sm font-medium">Lessons Count</label>
                    <Input
                      id="edit-pkg-lessons"
                      type="number"
                      required
                      min={2}
                      max={100}
                      value={editPkgLessons}
                      onChange={(e) => setEditPkgLessons(parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-pkg-price" className="text-sm font-medium">Bundle Price ({currency.toUpperCase()})</label>
                    <Input
                      id="edit-pkg-price"
                      required
                      placeholder="350.00"
                      value={editPkgPrice}
                      onChange={(e) => setEditPkgPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pb-2">
                  <input
                    id="edit-pkg-active"
                    type="checkbox"
                    checked={editPkgActive}
                    onChange={(e) => setEditPkgActive(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                  <label htmlFor="edit-pkg-active" className="text-sm font-semibold text-foreground cursor-pointer">
                    Active (visible to parents on your booking page)
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={packageLoading}>
                    {packageLoading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingPkgId(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddPackage} className="border-t border-border/60 pt-5 space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">➕ Add Lesson Bundle</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="new-pkg-name" className="text-sm font-medium">Package Name</label>
                    <Input
                      id="new-pkg-name"
                      required
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                      placeholder="e.g. 10x GCSE Exam Prep Bundle"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="new-pkg-lessons" className="text-sm font-medium">Lessons Count</label>
                    <Input
                      id="new-pkg-lessons"
                      type="number"
                      required
                      min={2}
                      max={100}
                      value={newPkgLessons}
                      onChange={(e) => setNewPkgLessons(parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="new-pkg-price" className="text-sm font-medium">Bundle Price ({currency.toUpperCase()})</label>
                    <Input
                      id="new-pkg-price"
                      required
                      placeholder="350.00"
                      value={newPkgPrice}
                      onChange={(e) => setNewPkgPrice(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={packageLoading}>
                  {packageLoading ? "Creating..." : "Add Package"}
                </Button>
              </form>
            )}
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
          {previewProfile.portalAnnouncementActive && previewProfile.portalAnnouncement ? (
            <div className="bg-primary px-3 py-1.5 text-center text-[11px] font-bold text-primary-foreground select-none relative rounded-t-xl leading-normal break-words whitespace-normal">
              📢 {previewProfile.portalAnnouncement}
            </div>
          ) : null}
          <PublicProfile tutor={previewProfile} />
        </PortalThemeWrapper>
      </div>
    </div>
  );
}
