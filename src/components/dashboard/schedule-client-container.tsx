"use client";

import { useState } from "react";
import { Settings, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScheduleEditor } from "./schedule-editor";
import { WeeklyScheduleSettings } from "./weekly-schedule-settings";
import type { TutorSlot, TutorProfile } from "@/lib/types";

type ScheduleClientContainerProps = {
  slots: TutorSlot[];
  profile: TutorProfile;
};

export function ScheduleClientContainer({ slots, profile }: ScheduleClientContainerProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="space-y-6">
      {/* Action Header bar */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
          className="rounded-xl font-semibold gap-1.5 text-xs h-9 cursor-pointer border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground bg-background/50"
        >
          <Settings className="size-4" />
          {showSettings ? "Hide Standard Hours" : "Configure Standard Hours"}
        </Button>
      </div>

      <div className={`grid gap-8 items-start transition-all duration-300 ${showSettings ? "grid-cols-1 xl:grid-cols-[1.25fr_0.75fr]" : "grid-cols-1"}`}>
        {/* Left Column: Interactive Calendar */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Calendar className="size-4.5 text-primary" />
            Interactive Calendar (Slots)
          </h2>
          <ScheduleEditor slots={slots} profile={profile} />
        </div>

        {/* Collapsible Right Column: Weekly Standard Hours & Bulk generation */}
        {showSettings && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Settings className="size-4.5 text-primary" />
              Standard Hours Rules
            </h2>
            <WeeklyScheduleSettings />
          </div>
        )}
      </div>
    </div>
  );
}
