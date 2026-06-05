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
  uploadDigitalResource,
} from "@/lib/dashboard/actions";
import { formatMoney } from "@/lib/format";

function parsePricePreview(raw: string): number | null {
  const normalized = raw.replace(/[£,\s]/g, "").trim().toLowerCase();
  if (normalized === "free" || normalized === "0" || normalized === "") {
    return 0;
  }
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
import type { DigitalResource } from "@/lib/types";

type StorefrontManagerProps = {
  resources: DigitalResource[];
  currency: string;
};

export function StorefrontManager({ resources, currency }: StorefrontManagerProps) {
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
    const result = await uploadDigitalResource(formData);

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    formRef.current?.reset();
    router.refresh();
    setLoading(false);
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
                <Input
                  id="resource-price"
                  name="price"
                  required
                  placeholder="4.99 or Free"
                  value={pricePreview}
                  onChange={(e) => setPricePreview(e.target.value)}
                />
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
          {resources.map((resource) => (
            <Card key={resource.id} className="yazz-surface">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{resource.title}</CardTitle>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
