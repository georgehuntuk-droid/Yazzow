"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LESSON_SLOT_DURATION_MINUTES } from "@/lib/constants";
import { createAvailabilitySlot, deleteAvailabilitySlot } from "@/lib/dashboard/actions";
import { countHourlySlots } from "@/lib/scheduling/hourly-slots";
import { formatSlotRange } from "@/lib/format";
import type { TutorSlot } from "@/lib/types";

type ScheduleEditorProps = {
  slots: TutorSlot[];
};

export function ScheduleEditor({ slots }: ScheduleEditorProps) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("17:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const previewCount = useMemo(() => {
    if (!date || !startTime || !endTime) return 0;
    const startsAt = new Date(`${date}T${startTime}`);
    const endsAt = new Date(`${date}T${endTime}`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return 0;
    return countHourlySlots(startsAt, endsAt);
  }, [date, startTime, endTime]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await createAvailabilitySlot({ date, startTime, endTime });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess("message" in result ? result.message : "Slots added.");
    setDate("");
    router.refresh();
    setLoading(false);
  }

  async function handleDelete(slotId: string) {
    if (!confirm("Remove this open slot?")) return;

    const result = await deleteAvailabilitySlot(slotId);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(null);
    router.refresh();
  }

  return (
    <Card className="yazz-surface">
      <CardHeader>
        <CardTitle>Availability (1-hour slots)</CardTitle>
        <CardDescription>
          Block out an afternoon — we split it into {LESSON_SLOT_DURATION_MINUTES}-minute
          bookable lessons. Parents can only book one hour at a time, not your whole block.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label htmlFor="slot-date" className="text-sm font-medium">
              Date
            </label>
            <Input
              id="slot-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="slot-start" className="text-sm font-medium">
              From
            </label>
            <Input
              id="slot-start"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="slot-end" className="text-sm font-medium">
              Until
            </label>
            <Input
              id="slot-end"
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={loading || previewCount === 0}>
              {loading
                ? "Adding…"
                : previewCount > 0
                  ? `Add ${previewCount} hour slot${previewCount === 1 ? "" : "s"}`
                  : "Add slots"}
            </Button>
          </div>
        </form>

        {previewCount > 0 ? (
          <p className="text-sm text-muted-foreground">
            This creates <strong>{previewCount}</strong> separate one-hour booking
            {previewCount === 1 ? "" : "s"} on your public calendar.
          </p>
        ) : date ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            End time must be whole hours after start (e.g. 2:00pm–5:00pm = 3 slots).
          </p>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? (
          <p className="text-sm text-primary" role="status">
            {success}
          </p>
        ) : null}

        {slots.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No upcoming slots. Add an hour or a block of hours above.
          </p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{formatSlotRange(slot.startsAt, slot.endsAt)}</p>
                  <Badge variant={slot.isBooked ? "secondary" : "outline"} className="mt-1">
                    {slot.isBooked ? "Booked" : "Open · 1 hour"}
                  </Badge>
                </div>
                {!slot.isBooked ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(slot.id)}
                    aria-label="Delete slot"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
