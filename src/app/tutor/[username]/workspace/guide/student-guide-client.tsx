"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookOpen, 
  CreditCard, 
  Sparkles, 
  GraduationCap, 
  MessageSquare, 
  CheckCircle2, 
  HelpCircle, 
  Smartphone, 
  Plus, 
  Play
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type StudentGuideClientProps = {
  tutorUsername: string;
  tutorDisplayName: string;
};

export function StudentGuideClient({ tutorUsername, tutorDisplayName }: StudentGuideClientProps) {
  const [activeTab, setActiveTab] = useState<"credits" | "tasks" | "cash" | "pwa">("credits");

  // Credits Simulator State
  const [credits, setCredits] = useState(2);
  const [creditsLogs, setCreditsLogs] = useState<string[]>([
    "Oliver's father purchased a 10x lesson bundle. Credits credited: +10.",
    " Oliver booked a GCSE Maths lesson. Credits deducted: -1.",
    " Oliver booked a second lesson. Credits deducted: -1."
  ]);
  const creditLimit = 1; // simulator uses 1 credit limit (allows down to -1)

  function logCredit(msg: string) {
    setCreditsLogs((prev) => [msg, ...prev.slice(0, 4)]);
  }

  function simulateBook() {
    if (credits - 1 >= -creditLimit) {
      const nextCredits = credits - 1;
      setCredits(nextCredits);
      logCredit(`✓ Lesson booked successfully. Credits: ${credits} → ${nextCredits}.`);
    } else {
      logCredit(`❌ Booking Blocked: Oliver has ${credits} credits and has hit the credit limit (overdraft) of -${creditLimit}. Please purchase more credits!`);
    }
  }

  function simulateBuyPack() {
    setCredits((prev) => prev + 10);
    logCredit(`✓ Prepay Bundle: Purchased 10x Pack. Credits added: +10. Balance: ${credits + 10}.`);
  }

  // Tasks Simulator State
  const [taskStatus, setTaskStatus] = useState<"pending" | "completed">("pending");
  const [taskLogs, setTaskLogs] = useState<string[]>(["Tutor assigned task: 'Solve Page 4 GCSE Algebra'."]);

  function submitTask() {
    setTaskStatus("completed");
    setTaskLogs((prev) => [
      "✓ Oliver submitted completion of 'Solve Page 4 GCSE Algebra'.",
      "✍️ Tutor left feedback: 'Superb workings! You got 10/10.'",
      ...prev
    ]);
  }

  function resetTask() {
    setTaskStatus("pending");
    setTaskLogs(["Tutor assigned task: 'Solve Page 4 GCSE Algebra'."]);
  }

  // Cash Pay Simulator State
  const [cashBalance, setCashBalance] = useState(25);
  const [cashStatus, setCashStatus] = useState<"unpaid" | "verifying" | "paid">("unpaid");
  const [cashLogs, setCashLogs] = useState<string[]>([
    "Oliver booked a 1h slot under 'Cash / Direct Bank Transfer'. Outstanding balance: £25.00."
  ]);

  function sendTransfer() {
    setCashStatus("verifying");
    setCashLogs((prev) => [
      "✓ Bank transfer sent. Notified tutor to verify payment.",
      ...prev
    ]);
  }

  function tutorVerify() {
    setCashStatus("paid");
    setCashLogs((prev) => [
      "✍️ Tutor marked booking as PAID. Balance: £0.00.",
      ...prev
    ]);
  }

  return (
    <div className="flex-1 space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="size-6 text-primary animate-pulse" />
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Student Workspace Guide & Playground
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Learn how prepaying credits, submitting homework, direct transfers, and phone alerts work on your portal.
          </p>
        </div>
        <Link 
          href={`/tutor/${tutorUsername}/workspace`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-4 text-xs font-bold shadow-sm hover:bg-muted transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="size-3.5" /> Back to Workspace
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-px overflow-x-auto">
        {[
          { id: "credits", label: "Prepaid Credits", icon: GraduationCap },
          { id: "tasks", label: "Homework & Tasks", icon: BookOpen },
          { id: "cash", label: "Direct/Cash Pay", icon: CreditCard },
          { id: "pwa", label: "Phone alerts & PWA", icon: Smartphone }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 px-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Credits Tab */}
      {activeTab === "credits" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">How prepaid credits work</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Your tutor, <strong className="text-foreground">{tutorDisplayName}</strong>, operates on a credit-ledger system.
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Prepay bundles:</strong> Purchase lesson packs (e.g. 10 lessons) under the &ldquo;Lesson packages&rdquo; tab to get credits in your account.
                </li>
                <li>
                  <strong className="text-foreground">Booking lessons:</strong> Booking a lesson slot automatically subtracts 1 credit. You do not need to enter card details each time you schedule!
                </li>
                <li>
                  <strong className="text-foreground">Credit Limits (Overdraft):</strong> Tutors can set a credit limit (e.g. -2). This allows you to book lessons in advance even when your balance runs out. Once this limit is exceeded, further bookings are blocked until you buy a package.
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground leading-normal">
              💡 <strong>Tip:</strong> Prepaying in bulk rewards you with custom discounts set by your tutor, helping you secure lower lesson rates.
            </div>
          </div>

          {/* Credits Simulator */}
          <Card className="yazz-surface border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm uppercase tracking-wider text-primary">Prepaid Credits Simulator</CardTitle>
              <CardDescription>Simulate booking lessons and purchasing credit packages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Oliver's Balance</span>
                  <p className="text-3xl font-black text-foreground">{credits} credits</p>
                </div>
                <Badge variant={credits >= 0 ? "outline" : "destructive"} className="px-2.5 py-1">
                  {credits >= 0 ? "Active Balance" : `Overdraft (${credits})`}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button onClick={simulateBook} className="flex-1 text-xs" size="sm">
                  <Play className="size-3 mr-1 fill-current" /> Book 1h Lesson
                </Button>
                <Button onClick={simulateBuyPack} variant="outline" className="flex-1 text-xs" size="sm">
                  <Plus className="size-3 mr-1" /> Buy 10x Pack
                </Button>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-4">
                <p className="text-xs font-bold text-foreground">Activity logs:</p>
                <div className="space-y-1.5 font-mono text-[11px] bg-muted/30 p-3 rounded-lg border border-border/40 max-h-36 overflow-y-auto">
                  {creditsLogs.map((log, idx) => (
                    <div key={idx} className={log.includes("Blocked") || log.includes("❌") ? "text-destructive" : log.includes("✓") ? "text-primary" : "text-muted-foreground"}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Homework & Task Board</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Keep track of school prep, exam worksheets, and homework assigned by your tutor.
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Task Details:</strong> Click on any task in your workspace to expand the description and instructions.
                </li>
                <li>
                  <strong className="text-foreground">Submit Completion:</strong> Toggle tasks as finished when homework is complete. This alerts your tutor to review it.
                </li>
                <li>
                  <strong className="text-foreground">Tutor Review & Feedback:</strong> Your tutor can leave notes directly on the task board, giving you immediate grading and guidance.
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground leading-normal">
              💡 <strong>Tip:</strong> The status matrix displays your completion progress so you never miss a deadline before your next session.
            </div>
          </div>

          {/* Tasks Simulator */}
          <Card className="yazz-surface border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm uppercase tracking-wider text-primary">Homework Simulator</CardTitle>
              <CardDescription>Simulate task assignment, submission, and tutor grading.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-background border border-border rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="font-bold text-sm text-foreground">Solve Page 4 GCSE Algebra</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Assigned by {tutorDisplayName}</p>
                </div>
                <Badge variant={taskStatus === "completed" ? "outline" : "default"} className={taskStatus === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-primary/10 text-primary"}>
                  {taskStatus === "completed" ? "Completed" : "Pending"}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button onClick={submitTask} disabled={taskStatus === "completed"} className="flex-1 text-xs" size="sm">
                  ✓ Submit Completion
                </Button>
                {taskStatus === "completed" && (
                  <Button onClick={resetTask} variant="ghost" className="text-xs" size="sm">
                    Reset
                  </Button>
                )}
              </div>

              <div className="space-y-2 border-t border-border/60 pt-4">
                <p className="text-xs font-bold text-foreground">Simulation timeline:</p>
                <div className="space-y-1.5 font-mono text-[11px] bg-muted/30 p-3 rounded-lg border border-border/40 max-h-36 overflow-y-auto">
                  {taskLogs.map((log, idx) => (
                    <div key={idx} className={log.includes("✍️") ? "text-amber-600 font-semibold" : log.includes("✓") ? "text-primary" : "text-muted-foreground"}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cash / Direct Pay Tab */}
      {activeTab === "cash" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Direct Payments & Cash Bookings</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                If enabled by your tutor, you can choose to make payments offline (e.g. Cash or Direct Bank Transfer).
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Bank Transfer Instructions:</strong> Upon choosing cash booking, the tutor&apos;s bank detail instructions (Sort code, Account number, reference code) are displayed on-screen.
                </li>
                <li>
                  <strong className="text-foreground">Send Transfer:</strong> Once you transfer the funds via your mobile banking app, let the tutor know.
                </li>
                <li>
                  <strong className="text-foreground">Payment Verification:</strong> The tutor will review their bank statements and mark the booking as paid. This resets your owed balance.
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground leading-normal">
              ⚠️ <strong>Note:</strong> Card checkout bookings via Stripe are credited automatically instantly, but Direct Transfer bookings require the tutor to manually confirm receipt of funds.
            </div>
          </div>

          {/* Cash Simulator */}
          <Card className="yazz-surface border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm uppercase tracking-wider text-primary">Direct Pay Simulator</CardTitle>
              <CardDescription>Simulate offline transfer and tutor verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 border border-border/50 rounded-xl space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Tutor Payment Instructions:</span>
                <p className="text-foreground leading-relaxed italic bg-background p-2.5 rounded-lg border border-border/40">
                  &ldquo;Please transfer £25.00 to Account: 12345678, Sort: 11-22-33. Quote ref: Lesson-Oliver&rdquo;
                </p>
              </div>

              <div className="flex justify-between items-center px-2">
                <span className="text-xs font-semibold text-muted-foreground">Outstanding balance:</span>
                <span className={`text-sm font-black ${cashStatus === "paid" ? "text-emerald-600 line-through" : "text-destructive"}`}>
                  £{cashStatus === "paid" ? "0.00" : "25.00"}
                </span>
              </div>

              <div className="flex gap-2">
                <Button onClick={sendTransfer} disabled={cashStatus !== "unpaid"} className="flex-1 text-xs" size="sm">
                  📲 Send Bank Transfer
                </Button>
                <Button onClick={tutorVerify} disabled={cashStatus !== "verifying"} variant="outline" className="flex-1 text-xs" size="sm">
                  ✍️ Tutor Verifies Receipt
                </Button>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-4">
                <p className="text-xs font-bold text-foreground">Simulation status:</p>
                <div className="space-y-1.5 font-mono text-[11px] bg-muted/30 p-3 rounded-lg border border-border/40 max-h-36 overflow-y-auto">
                  {cashLogs.map((log, idx) => (
                    <div key={idx} className={log.includes("✓") ? "text-primary" : log.includes("paid") || log.includes("PAID") ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Phone alerts & PWA Tab */}
      {activeTab === "pwa" && (
        <div className="space-y-6">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold">Install Yazzow App & Set Up Phone Notifications</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              Yazzow is a Progressive Web App (PWA). You can pin the student workspace directly to your mobile phone or desktop home screen to receive real-time notifications for new chat messages, new availability slots, and lesson cancellations.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="yazz-surface">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <span className="inline-flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">1</span>
                  iOS / Apple Safari
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>1. Open Safari and navigate to your workspace page.</p>
                <p>2. Tap the <strong>Share</strong> button <span className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] text-foreground">⎙</span> at the bottom of Safari.</p>
                <p>3. Scroll down and select <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</p>
                <p>4. Launch the newly added Yazzow app from your home screen.</p>
                <p>5. Click the <strong>&ldquo;Enable Phone Notifications&rdquo;</strong> toggle at the top of the page and tap <strong>Allow</strong>.</p>
              </CardContent>
            </Card>

            <Card className="yazz-surface">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <span className="inline-flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">2</span>
                  Android / Chrome
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>1. Open Chrome and log into your workspace.</p>
                <p>2. Click the <strong>&ldquo;Install App&rdquo;</strong> banner at the bottom or top of the page (or click Chrome Options menu and choose &ldquo;Install App&rdquo;).</p>
                <p>3. Confirm installation. The app will be pinned to your apps drawer.</p>
                <p>4. Open the installed app.</p>
                <p>5. Go to the workspace navbar, click the <strong>Notification Toggle</strong>, and grant permissions.</p>
              </CardContent>
            </Card>

            <Card className="yazz-surface">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <span className="inline-flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">3</span>
                  Desktop / Chrome / Edge
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>1. Access the workspace on your laptop or computer.</p>
                <p>2. Click the <strong>Install Icon</strong> (small monitor/arrow) on the right side of Chrome&apos;s URL address bar.</p>
                <p>3. Open Yazzow as a standalone app.</p>
                <p>4. Enable notification permissions inside the app to receive native system toast popups whenever you get a message.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
