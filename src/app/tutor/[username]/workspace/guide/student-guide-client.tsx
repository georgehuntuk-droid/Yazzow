"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookOpen, 
  CreditCard, 
  Sparkles, 
  GraduationCap, 
  HelpCircle, 
  Smartphone, 
  Plus, 
  Play,
  Calendar,
  DollarSign,
  Star,
  Info,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StudentGuideClientProps = {
  tutorUsername: string;
  tutorDisplayName: string;
};

type TabId = "lessons" | "credits" | "cash" | "tasks" | "pwa";

export function StudentGuideClient({ tutorUsername, tutorDisplayName }: StudentGuideClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("lessons");

  // Lessons Simulator State
  const [demoLessons, setDemoLessons] = useState([
    { id: "1", title: "GCSE Maths Practice", startsAt: "Tomorrow, 17:00", status: "confirmed", feedback: null, rating: 0 },
    { id: "2", title: "Algebra Basics", startsAt: "Yesterday, 16:00", status: "completed", feedback: "Excellent progress today. Focus on quadratics!", rating: 5 }
  ]);
  const [ratingMessage, setRatingMessage] = useState("");

  function handleRateLesson(lessonId: string, rating: number) {
    setDemoLessons(prev => 
      prev.map(l => l.id === lessonId ? { ...l, rating } : l)
    );
    setRatingMessage(`Rated ${rating} stars! Thank you for your feedback.`);
    setTimeout(() => setRatingMessage(""), 3000);
  }

  // Credits Simulator State
  const [credits, setCredits] = useState(2);
  const [creditsLogs, setCreditsLogs] = useState<string[]>([
    "Oliver's father purchased a 10x lesson bundle. Credits credited: +10.",
    "Oliver booked a GCSE Maths lesson. Credits deducted: -1.",
    "Oliver booked a second lesson. Credits deducted: -1."
  ]);
  const creditLimit = 1;

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
  const [showTaskDetails, setShowTaskDetails] = useState(false);

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

  // Cash Pay / Owed Simulator State
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
              Workspace Guide & Simulator
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Learn how bookings, prepaid credits, outstanding balances, homework, and phone alerts work on your portal.
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
      <div className="flex gap-2 border-b border-border pb-px overflow-x-auto scrollbar-none">
        {([
          { id: "lessons", label: "Schedule & Lessons", icon: Calendar },
          { id: "credits", label: "Prepaid Credits", icon: GraduationCap },
          { id: "cash", label: "Outstanding Balance", icon: CreditCard },
          { id: "tasks", label: "Homework & Tasks", icon: BookOpen },
          { id: "pwa", label: "Mobile App & Notifications", icon: Smartphone }
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 px-3 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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

      {/* 1. Schedule & Lessons Tab */}
      {activeTab === "lessons" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Booking Calendars & Lesson Schedule</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Your portal serves as a direct booking scheduler between you and <strong className="text-foreground">{tutorDisplayName}</strong>.
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Booking Calendar:</strong> Head to the tutor&apos;s main portal tab to book 1-on-1 slots. If you prepay, slots are booked instantly using credits. If you pay via card, checkouts are processed securely.
                </li>
                <li>
                  <strong className="text-foreground">Upcoming Schedule:</strong> When a lesson is booked, it immediately appears in your workspace under the **Upcoming Schedule** list. This gives you a clear visual timetable of your upcoming study slots.
                </li>
                <li>
                  <strong className="text-foreground">Tutor Lesson Notes & Feedback:</strong> After a lesson completes, your tutor can write summary feedback logs. You can open past lessons in your workspace ledger to read lesson hints, study focus areas, and view tutor feedback.
                </li>
                <li>
                  <strong className="text-foreground">Lesson Ratings:</strong> Tutors value your feedback! You can rate completed lessons out of 5 stars directly in your past schedule ledger.
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground leading-normal flex items-start gap-2">
              <Info className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Multiple Children?</strong> If you have more than one child registered under the same parent email with this tutor, Yazzow will show a <strong>&ldquo;Switch Student&rdquo;</strong> dropdown at the top of the workspace to easily toggle between their individual schedules and homework sheets.
              </span>
            </div>
          </div>

          {/* Lessons Simulator */}
          <Card className="yazz-surface border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm uppercase tracking-wider text-primary">Lessons & Feedback Simulator</CardTitle>
              <CardDescription>Simulate reading lesson feedback and rating past lessons.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ratingMessage && (
                <p className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-200">
                  {ratingMessage}
                </p>
              )}
              <div className="space-y-3">
                {demoLessons.map((l) => (
                  <div key={l.id} className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-foreground">{l.title}</h4>
                      <Badge variant={l.status === "confirmed" ? "default" : "outline"} className="text-[10px] uppercase font-bold px-1.5 py-0">
                        {l.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Time: {l.startsAt}</p>
                    
                    {l.status === "completed" && (
                      <div className="border-t border-border/40 pt-2 space-y-1.5">
                        <span className="text-[10px] font-bold text-primary block">Tutor Lesson Feedback:</span>
                        <p className="text-xs text-foreground italic bg-background p-2 rounded border border-border/30">
                          &ldquo;{l.feedback}&rdquo;
                        </p>
                        
                        {/* Rating stars */}
                        <div className="flex items-center gap-1 pt-1">
                          <span className="text-[10px] text-muted-foreground font-semibold mr-1">Rate lesson:</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRateLesson(l.id, star)}
                              className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star className={cn("size-3.5", star <= l.rating ? "fill-amber-400" : "text-muted-foreground/30")} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Prepaid Credits Tab */}
      {activeTab === "credits" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">How Prepaid Credits Work</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Your tutor operates on a clean credit-ledger system, making scheduling bundles friction-free.
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Prepay Bundles:</strong> Purchase lesson packs (e.g. 5x, 10x, or 20x lesson packages) under the &ldquo;Lesson Packages&rdquo; tab. This instantly adds credits to your child&apos;s workspace.
                </li>
                <li>
                  <strong className="text-foreground">Frictionless Bookings:</strong> Booking a lesson automatically deducts 1 credit. There is no need to enter credit card details or checkout every time you schedule a lesson!
                </li>
                <li>
                  <strong className="text-foreground">Credit Limits (Overdraft):</strong> Tutors can set a credit limit (e.g., -1 or -2 credits). This allows you to book upcoming lessons on credit in advance if you run out. Once your balance crosses below this overdraft threshold, further bookings are locked until you buy a package.
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground leading-normal flex items-start gap-2">
              <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Save Money:</strong> Tutors typically configure discount bundles, rewarding prepay purchases with discounted rates (e.g., £22/hr instead of £25/hr).
              </span>
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
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Oliver&apos;s Balance</span>
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

      {/* 3. Outstanding Balances & Cash Tab */}
      {activeTab === "cash" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Outstanding Balances & Cash Payments</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Understand how the system tracks money owed and how to pay offline.
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">What is Outstanding Balance?</strong> This is the total amount you currently owe the tutor. Outstanding balance accumulates when you book a lesson on credit (overdraft) or choose an offline checkout payment method.
                </li>
                <li>
                  <strong className="text-foreground">Direct/Cash Payments:</strong> If your tutor supports offline payments (e.g. Bank Transfer or Cash), you can book lessons without inputting card details on screen.
                </li>
                <li>
                  <strong className="text-foreground">Tutor Bank Details:</strong> Upon booking under cash/direct transfer, the tutor&apos;s specific sort code, account number, and invoice instructions will display on your screen.
                </li>
                <li>
                  <strong className="text-foreground">Marking Paid:</strong> Once you transfer the bank funds (e.g., via your mobile banking app), click **Send Transfer** to notify the tutor. The tutor will check their bank statement and mark the invoice as PAID in their ledger, resetting your outstanding balance to zero.
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground leading-normal flex items-start gap-2">
              <DollarSign className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Where is my balance shown?</strong> You can view your current outstanding balance in real-time on your student workspace home screen inside the **Outstanding Balance** status tile.
              </span>
            </div>
          </div>

          {/* Cash Simulator */}
          <Card className="yazz-surface border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm uppercase tracking-wider text-primary">Direct Pay & Balance Simulator</CardTitle>
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

      {/* 4. Homework & Tasks Tab */}
      {activeTab === "tasks" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Homework & Task Board</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Keep track of study sheets, practice assignments, and exam checklists assigned by your tutor.
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Open Details Modal:</strong> Click on any task card on your board to **open the detailed dialog modal**. This reveals the full task description, instructions, resources, and tutor hint feedback.
                </li>
                <li>
                  <strong className="text-foreground">Ticking Completion:</strong> Click the checkbox circle on the task board (or click the action button inside the details modal) to submit the task as completed. This triggers an automated alert to your tutor.
                </li>
                <li>
                  <strong className="text-foreground">Tutor hint/grading notes:</strong> Your tutor can leave hints, links, or review notes directly on each task. You can view these anytime by opening the task details.
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground leading-normal">
              💡 <strong>Tip:</strong> Ticking homework as completed keeps your tutor updated on your progress before your next session, making 1-on-1 tutoring time more efficient.
            </div>
          </div>

          {/* Tasks Simulator */}
          <Card className="yazz-surface border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm uppercase tracking-wider text-primary">Homework Simulator</CardTitle>
              <CardDescription>Simulate task detail modals and submissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                onClick={() => setShowTaskDetails(true)}
                className="p-4 bg-background border border-border rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:border-primary/40 hover:scale-[1.01] transition-all group"
              >
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">Solve Page 4 GCSE Algebra</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Assigned by {tutorDisplayName} • Click to open details</p>
                </div>
                <Badge variant={taskStatus === "completed" ? "outline" : "default"} className={taskStatus === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-primary/10 text-primary"}>
                  {taskStatus === "completed" ? "Completed" : "Pending"}
                </Badge>
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

      {/* 5. Mobile App & Notifications Tab */}
      {activeTab === "pwa" && (
        <div className="space-y-6">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold">Install Yazzow Mobile App & Notifications</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              Yazzow is built as a Progressive Web App (PWA). You can download and pin the workspace directly to your mobile home screen to get instant push alerts for tutor chat messages, slot reminders, and calendar changes.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="yazz-surface">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <span className="inline-flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">1</span>
                  iOS / Safari (iPhone)
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
                <p>2. Tap the **&ldquo;Download App&rdquo;** banner at the top of the workspace home screen.</p>
                <p>3. A native Chrome installation dialog will pop up immediately. Confirm by clicking **&ldquo;Install&rdquo;**.</p>
                <p>4. Launch the app from your home screen, navigate to the sidebar menu, click the **Notification Toggle**, and grant permissions.</p>
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

      {/* Simulator Modal for Tasks */}
      {showTaskDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTaskDetails(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
              <Badge variant={taskStatus === "completed" ? "outline" : "default"} className={taskStatus === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-primary/10 text-primary"}>
                {taskStatus === "completed" ? "✓ Completed" : "⚡ To Do"}
              </Badge>
              <button onClick={() => setShowTaskDetails(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
                <X className="size-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-heading text-lg font-bold text-foreground">Solve Page 4 GCSE Algebra</h3>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Instructions:</span>
                <p className="bg-muted/40 p-3.5 rounded-xl border border-border/40 text-xs text-foreground/90 leading-relaxed">
                  Solve exercises 1 to 10 on linear quadratic equations and simplify all expressions. Show your full working sheets.
                </p>
              </div>
              {taskStatus === "completed" && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Tutor hint/grading notes:</span>
                  <p className="bg-primary/5 p-3 rounded-xl border border-primary/15 text-xs italic text-foreground/90">
                    &ldquo;Superb workings! You got 10/10.&rdquo;
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border/40 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowTaskDetails(false)} size="sm" className="text-xs">Close</Button>
              <Button 
                onClick={() => {
                  if (taskStatus === "pending") submitTask();
                  else resetTask();
                  setShowTaskDetails(false);
                }} 
                size="sm" 
                className="text-xs font-bold"
              >
                {taskStatus === "completed" ? "Reset to To-Do" : "Mark as Complete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
