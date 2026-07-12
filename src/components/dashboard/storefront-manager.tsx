"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deleteDigitalResource,
  toggleDigitalResourcePublished,
  insertDigitalResourceRecord,
} from "@/lib/dashboard/actions";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/format";

function parsePricePreview(raw: string): number | null {
  const normalized = raw.replace(/[£,\s]/g, "").trim().toLowerCase();
  if (normalized === "free" || normalized === "0") {
    return 0;
  }
  if (normalized === "") {
    return null;
  }
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
import type { DigitalResource, TutorProfile } from "@/lib/types";

type StorefrontManagerProps = {
  resources: DigitalResource[];
  currency: string;
  profile?: TutorProfile;
};

export function StorefrontManager({ resources, currency, profile }: StorefrontManagerProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricePreview, setPricePreview] = useState("");

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const priceRaw = String(formData.get("price") ?? "").trim();
    const file = formData.get("file") as File;

    if (!title) {
      setError("Title is required.");
      setLoading(false);
      return;
    }

    if (!priceRaw) {
      setError("Price is required.");
      setLoading(false);
      return;
    }

    if (!file || file.size === 0) {
      setError("Choose a PDF or DOCX file.");
      setLoading(false);
      return;
    }

    if (file.size > 52_428_800) { // 50MB
      setError("File must be 50 MB or smaller.");
      setLoading(false);
      return;
    }

    const allowedMime = new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);
    if (!allowedMime.has(file.type)) {
      setError("Only PDF and DOCX files are allowed.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to upload worksheets.");
      }

      const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
      const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

      // 1. Direct upload from browser to 'worksheets' bucket
      const { error: uploadErr } = await supabase.storage
        .from("worksheets")
        .upload(storagePath, file, { contentType: file.type });

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      // 2. Insert record in DB
      const dbRes = await insertDigitalResourceRecord({
        title,
        description,
        priceRaw,
        filePath: storagePath,
      });

      if (!dbRes.ok) {
        // Cleanup uploaded file on DB insert error
        await supabase.storage.from("worksheets").remove([storagePath]);
        throw new Error(dbRes.error);
      }

      formRef.current?.reset();
      setPricePreview("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload worksheet.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(resourceId: string) {
    if (!confirm("Delete this worksheet pack? This cannot be undone.")) return;

    const result = await deleteDigitalResource(resourceId);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  async function handleToggle(resourceId: string, nextPublished: boolean) {
    const result = await toggleDigitalResourcePublished(resourceId, nextPublished);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="yazz-surface">
        <CardHeader>
          <CardTitle>Upload a learning pack</CardTitle>
          <CardDescription>
            PDF or DOCX (up to 50 MB). Listed on <strong>The shelf</strong> on your portal — parents
            message you to buy. You handle payment yourself; no Stripe Connect needed for packs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleUpload} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="resource-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="resource-title"
                  name="title"
                  required
                  placeholder="GCSE Algebra revision pack"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="resource-price" className="text-sm font-medium">
                  Price ({currency.toUpperCase()})
                </label>
                <div className="flex gap-2">
                  <Input
                    id="resource-price"
                    name="price"
                    required
                    placeholder="4.99"
                    value={pricePreview}
                    onChange={(e) => setPricePreview(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={
                      ["free", "0"].includes(pricePreview.trim().toLowerCase())
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setPricePreview("free")}
                  >
                    Free
                  </Button>
                </div>
                {(() => {
                  const cents = parsePricePreview(pricePreview);
                  if (cents === null) return null;
                  return (
                    <p className="text-xs text-muted-foreground">
                      Shown on your portal as{" "}
                      <span className="font-medium text-foreground">
                        {cents === 0 ? "Free" : formatMoney(cents, currency)}
                      </span>
                      {cents === 0
                        ? " — parents can message you to request this free pack."
                        : " — you arrange payment with parents directly."}
                    </p>
                  );
                })()}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="resource-description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="resource-description"
                name="description"
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="What's inside this pack?"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="resource-file" className="text-sm font-medium">
                File
              </label>
              <Input
                id="resource-file"
                name="file"
                type="file"
                required
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading ? "Uploading…" : "Publish to shelf"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {resources.length === 0 ? (
        <Card className="yazz-surface">
          <CardContent className="py-12 text-center text-muted-foreground">
            No worksheet packs yet. Upload your first pack above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map((resource) => {
            const isOwnerOfResource = !profile || !resource.tutorId || resource.tutorId === profile.id;
            return (
              <Card key={resource.id} className="yazz-surface">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                      {!isOwnerOfResource && (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          🏫 Shared Vault
                        </span>
                      )}
                    </div>
                    <Badge variant={resource.isPublished ? "default" : "secondary"}>
                      {resource.isPublished ? "Live" : "Hidden"}
                    </Badge>
                  </div>
                {resource.description ? (
                  <CardDescription>{resource.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <span className="font-medium text-primary">
                  {resource.priceCents === 0 ? "Free" : formatMoney(resource.priceCents, resource.currency)}
                </span>
                {isOwnerOfResource ? (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(resource.id, !resource.isPublished)}
                    >
                      {resource.isPublished ? "Hide" : "Publish"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(resource.id)}
                      aria-label="Delete resource"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/60 px-2.5 py-1 rounded-lg">
                    Read Only
                  </span>
                )}
              </CardContent>
            </Card>
          );})}
        </div>
      )}
    </div>
  );
}
