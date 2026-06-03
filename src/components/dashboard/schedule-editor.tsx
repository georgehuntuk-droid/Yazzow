"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createAvailabilitySlot, deleteAvailabilitySlot } from "@/lib/dashboard/actions";
import { formatSlotRange } from "@/lib/format";
import type { TutorSlot } from "@/lib/types";

type ScheduleEditorProps = {
  slots: TutorSlot[];
};

export function ScheduleEditor({ slots }: ScheduleEditorProps) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createAvailabilitySlot({ date, startTime, endTime });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

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

    router.refresh();
  }

  return (
    <Card className="yazz-surface">
      <CardHeader>
        <CardTitle>Weekly hours & one-off slots</CardTitle>
        <CardDescription>
          Add open times parents can book. Slots appear on your public calendar instantly.
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
              Start
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
              End
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding…" : "Add slot"}
            </Button>
          </div>
        </form>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {slots.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No upcoming slots. Add your first open time above.
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
                    {slot.isBooked ? "Booked" : "Open"}
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
