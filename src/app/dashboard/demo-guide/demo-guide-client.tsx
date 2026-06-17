"use client";

import { useState } from "react";
import { 
  Users, 
  CreditCard, 
  Sparkles, 
  MessageSquare, 
  CalendarRange, 
  Plus, 
  Minus, 
  RefreshCw, 
  BadgeAlert, 
  Star, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DemoGuideClient() {
  const [activeTab, setActiveTab] = useState<"credits" | "owed" | "reminders" | "feedback">("credits");

  // Credits Simulator State
  const [simCredits, setSimCredits] = useState(2);
  const [simLimit, setSimLimit] = useState(1);
  const [creditsLogs, setCreditsLogs] = useState<string[]>([
    "Simulator initialized: Oliver Smith has 2 prepaid credits."
  ]);

  function logCredits(msg: string) {
    setCreditsLogs((prev) => [msg, ...prev.slice(0, 4)]);
  }

  function handleSimBook() {
    if (simCredits - 1 >= -simLimit) {
      const nextCredits = simCredits - 1;
      setSimCredits(nextCredits);
      logCredits(`✓ Lesson booked. Credits: ${simCredits} → ${nextCredits}. Allowed.`);
    } else {
      logCredits(`❌ Blocked: Oliver has ${simCredits} credits & limit is ${simLimit}. Booking exceeds overdraft!`);
    }
  }

  function handleSimAddPackage() {
    setSimCredits((prev) => prev + 5);
    logCredits(`✓ Prepay Package: Credited +5 lessons. New balance: ${simCredits + 5}.`);
  }

  // Owed Simulator State
  const [simBookings, setSimBookings] = useState([
    { id: "1", date: "Sat, 20 Jun", time: "17:00 – 18:00", amount: 2500, isPaid: false }
  ]);
  const [owedLogs, setOwedLogs] = useState<string[]>(["Sat, 20 Jun lesson defaults to unpaid (owed)."]);

  const totalOwedCents = simBookings.reduce((sum, b) => sum + (b.isPaid ? 0 : b.amount), 0);

  function logOwed(msg: string) {
    setOwedLogs((prev) => [msg, ...prev.slice(0, 4)]);
  }

  function toggleSimPaid(id: string) {
    setSimBookings((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const nextPaid = !b.isPaid;
          logOwed(`✓ Lesson ${b.date} marked as ${nextPaid ? "Paid" : "Owed"}.`);
          return { ...b, isPaid: nextPaid };
        }
        return b;
      })
    );
  }

  function addSimBooking() {
    const nextId = (simBookings.length + 1).toString();
    const dates = ["Wed, 24 Jun", "Sat, 27 Jun", "Wed, 01 Jul"];
    const nextDate = dates[simBookings.length % dates.length];
    setSimBookings((prev) => [
      ...prev,
      { id: nextId, date: nextDate, time: "17:00 – 18:00", amount: 2500, isPaid: false }
    ]);
    logOwed(`✓ Added new offline cash booking for ${nextDate}. Amount: £25.00.`);
  }

  // Reminders Simulator State
  const [reminderThreshold, setReminderThreshold] = useState(50);
  const [reminderDays, setReminderDays] = useState(7);
  const [reminderLogs, setReminderLogs] = useState<string[]>([
    "Tutor auto-reminders configured: Threshold £50.00, Time Limit: 7 days."
  ]);
  const [simChat, setSimChat] = useState<{ sender: "user" | "tutor" | "system"; text: string }[]>([
    { sender: "tutor", text: "Welcome to Yazzow messaging!" }
  ]);

  function triggerManualReminder() {
    const reminderMsg = `🔔 [Payment Reminder] Hello, this is a friendly reminder that you have an outstanding balance of £${totalOwedCents / 100}.00 for our lessons. Please view payment instructions and settle at your convenience. Thank you!`;
    setSimChat((prev) => [...prev, { sender: "tutor", text: reminderMsg }]);
    setReminderLogs((prev) => ["Manual reminder sent to chat inbox.", ...prev.slice(0, 3)]);
  }

  function checkAutoReminders() {
    if (totalOwedCents >= reminderThreshold * 100) {
      const reminderMsg = `🔔 [Payment Reminder] Hello, this is a friendly reminder that you have an outstanding balance of £${totalOwedCents / 100}.00 for our lessons. Please view payment instructions and settle at your convenience. Thank you!`;
      setSimChat((prev) => [...prev, { sender: "tutor", text: reminderMsg }]);
      setReminderLogs((prev) => [
        `⚠️ Auto-Triggered: Balance (£${totalOwedCents / 100}.00) meets threshold (£${reminderThreshold}.00). Reminder sent.`,
        ...prev.slice(0, 3)
      ]);
    } else {
      setReminderLogs((prev) => [
        `Checked: Balance (£${totalOwedCents / 100}.00) is below threshold (£${reminderThreshold}.00). No action.`,
        ...prev.slice(0, 3)
      ]);
    }
  }

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("Understood algebra equations quickly today!");
  const [generalNotes, setGeneralNotes] = useState("GCSE student working towards Grade 7.");
  const [feedbacks, setFeedbacks] = useState([
    { date: "Wed, 17 Jun", rating: 5, text: "Great focus on simultaneous equations." }
  ]);

  function saveFeedback() {
    if (!feedbackText.trim()) return;
    setFeedbacks((prev) => [
      { date: "Sat, 20 Jun", rating: feedbackRating, text: feedbackText },
      ...prev
    ]);
    setFeedbackText("");
  }

  return (
    <div className="flex-1 space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <HelpCircle className="size-6 text-primary" />
          <h1 className="font-heading text-3xl font-semibold">Tutor Feature Guide & Playground</h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Learn how to use Yazzow's credit limits, owed balances, automated payment reminders, and student feedback.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-px overflow-x-auto">
        {[
          { id: "credits", label: "Credits & Overdraft", icon: Users },
          { id: "owed", label: "Owed Balances", icon: CreditCard },
          { id: "reminders", label: "Payment Reminders", icon: MessageSquare },
          { id: "feedback", label: "Notes & Feedback", icon: CalendarRange }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 px-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-foreground"
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
              <h2 className="text-xl font-semibold">Lesson Credits & Credit Limits (Overdraft)</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Prepaid credits and Credit Limits allow you to control how families book lessons:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Lesson Credits:</strong> Prepaid lessons. When a parent books a lesson via the portal, this count decreases by 1.
                </li>
                <li>
                  <strong className="text-foreground">Credit Limit (Overdraft):</strong> The number of lessons a student is allowed to book without prepayment. By default, this is 0 (prepay only).
                </li>
                <li>
                  <strong className="text-foreground">Negative Balance:</strong> If you set a credit limit of 2, the student can book lessons down to -2 credits. Once exceeded, further bookings are blocked until a payment is recorded.
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80">
              <span className="font-semibold text-xs block mb-1">💡 How to grant free lessons:</span>
              <p className="text-xs text-muted-foreground leading-normal">
                Use the **Override** buttons next to Lesson Credits in the Student Ledger. You can manually set the credits count to a positive number (e.g. +5 credits) to grant them free booking slots.
              </p>
            </div>
          </div>

          {/* Credits Simulator */}
          <Card className="yazz-surface border-primary/20">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Credits Live Playground</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setSimCredits(2);
                    setSimLimit(1);
                    setCreditsLogs(["Simulator reset."]);
                  }}
                  className="size-7"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
              <CardDescription className="text-xs">Test booking blocks and overdrafts</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Mock Student card */}
              <div className="p-3.5 rounded-xl border border-border bg-background shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">Oliver Smith</h3>
                    <p className="text-[10px] text-muted-foreground">Parent: oliver.parent@example.com</p>
                  </div>
                  <Badge variant={simCredits < 0 ? "destructive" : simCredits === 0 ? "secondary" : "default"}>
                    {simCredits} credits
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                  <div>
                    <span className="block font-semibold text-[10px] uppercase text-muted-foreground">Overdraft Limit</span>
                    <span className="text-foreground font-bold">{simLimit} lesson{simLimit === 1 ? "" : "s"}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-[10px] uppercase text-muted-foreground">Min. Allowed Balance</span>
                    <span className="text-foreground font-bold">-{simLimit} credits</span>
                  </div>
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="space-y-2">
                <span className="font-semibold text-[10px] uppercase text-muted-foreground block">Simulate Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={handleSimBook} className="text-xs h-9 cursor-pointer">
                    Book Lesson (-1)
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleSimAddPackage} className="text-xs h-9 cursor-pointer">
                    Buy Pack (+5)
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-[10px] uppercase text-muted-foreground block">Adjust Credit Limit (Overdraft)</span>
                <div className="flex gap-1.5">
                  {[0, 1, 3].map((limit) => (
                    <button
                      key={limit}
                      onClick={() => {
                        setSimLimit(limit);
                        logCredits(`Changed Credit Limit to ${limit}. Minimum allowed balance is now -${limit}.`);
                      }}
                      className={`flex-1 py-1 rounded border text-xs font-semibold transition-all cursor-pointer ${
                        simLimit === limit
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {limit === 0 ? "0 (Prepay)" : `${limit} Lesson`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logs */}
              <div className="space-y-1.5 border-t border-border/60 pt-3">
                <span className="font-semibold text-[10px] uppercase text-muted-foreground block">Simulator Activity Log</span>
                <div className="bg-muted/30 border border-border/40 rounded-lg p-2.5 space-y-1 h-[110px] overflow-y-auto font-mono text-[10px]">
                  {creditsLogs.map((log, i) => (
                    <p key={i} className="text-muted-foreground leading-normal">{log}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Owed Tab */}
      {activeTab === "owed" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Offline Payments & Owed Earnings</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Yazzow lets tutors offer offline payments (e.g., bank transfer or cash) while keeping billing organized:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Offline Payment Terms:</strong> Direct cash bookings do not default to "paid". They start as unpaid/owed.
                </li>
                <li>
                  <strong className="text-foreground">Owed Badge:</strong> Students owing money display a red **Owed: £XX.XX** badge on the student ledger headers.
                </li>
                <li>
                  <strong className="text-foreground">Marking Statuses:</strong> Tutors can mark these bookings as "Paid" or "Owed" at any time from the lesson history.
                </li>
                <li>
                  <strong className="text-foreground">Outstanding Revenue Card:</strong> Total unpaid lessons accumulate on the main dashboard stats widget under "Owed Outstanding" so you always know what is due.
                </li>
              </ul>
            </div>
          </div>

          {/* Owed Simulator */}
          <Card className="yazz-surface border-primary/20">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Owed Balance Playground</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setSimBookings([{ id: "1", date: "Sat, 20 Jun", time: "17:00 – 18:00", amount: 2500, isPaid: false }]);
                    setOwedLogs(["Sat, 20 Jun lesson defaults to unpaid (owed)."]);
                  }}
                  className="size-7"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
              <CardDescription className="text-xs">Manage cash and offline lessons</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Owed outstanding widget */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border bg-background text-center shadow-sm">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Owed Balance</span>
                  <span className={`text-xl font-bold ${totalOwedCents > 0 ? "text-rose-600 animate-pulse" : "text-muted-foreground"}`}>
                    £{(totalOwedCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-background text-center shadow-sm flex flex-col justify-center items-center">
                  <Button size="sm" variant="outline" onClick={addSimBooking} className="text-[10px] h-7 w-full font-bold cursor-pointer">
                    <Plus className="size-3 mr-1" /> Book Offline
                  </Button>
                </div>
              </div>

              {/* Bookings List */}
              <div className="space-y-2">
                <span className="font-semibold text-[10px] uppercase text-muted-foreground block">Booking History</span>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {simBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-2 border border-border/80 rounded-lg text-xs bg-background">
                      <div>
                        <span className="font-semibold block">{b.date}</span>
                        <span className="text-[10px] text-muted-foreground">{b.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={b.isPaid ? "outline" : "destructive"} className={b.isPaid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : ""}>
                          {b.isPaid ? "Paid" : "Owed"}
                        </Badge>
                        <button
                          onClick={() => toggleSimPaid(b.id)}
                          className="px-2 py-0.5 rounded border border-border hover:bg-muted text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Mark {b.isPaid ? "Owed" : "Paid"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logs */}
              <div className="space-y-1.5 border-t border-border/60 pt-3">
                <span className="font-semibold text-[10px] uppercase text-muted-foreground block">Activity Log</span>
                <div className="bg-muted/30 border border-border/40 rounded-lg p-2.5 space-y-1 h-[80px] overflow-y-auto font-mono text-[10px]">
                  {owedLogs.map((log, i) => (
                    <p key={i} className="text-muted-foreground leading-normal">{log}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reminders Tab */}
      {activeTab === "reminders" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Automated & Manual Chat Reminders</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Reminders are delivered directly inside the Yazzow in-app chat inbox to keep communications professional:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">In-App Delivery:</strong> All non-auth billing notices are sent as chat messages rather than emails.
                </li>
                <li>
                  <strong className="text-foreground">Manual reminders:</strong> Tutors can click **"Send Reminder"** next to any student owing money in the student ledger.
                </li>
                <li>
                  <strong className="text-foreground">Automated reminders:</strong> Tutors can configure automatic reminders in **Settings** triggered by:
                  <ul className="list-circle pl-5 mt-1 space-y-1">
                    <li>*Owed Balance threshold* (e.g. £50.00 outstanding balance).</li>
                    <li>*Completion time threshold* (e.g. 7 days post-lesson if still unpaid).</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-foreground">Anti-Spam Filter:</strong> The engine checks and ensures only 1 reminder is allowed every 7 days to prevent cluttering chat history.
                </li>
              </ul>
            </div>
          </div>

          {/* Reminders Simulator */}
          <Card className="yazz-surface border-primary/20">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Reminders Playground</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setReminderThreshold(50);
                    setReminderDays(7);
                    setSimChat([{ sender: "tutor", text: "Welcome to Yazzow messaging!" }]);
                    setReminderLogs(["Simulator reset."]);
                  }}
                  className="size-7"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
              <CardDescription className="text-xs">Simulate chat alerts and threshold triggers</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Settings selectors */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 border border-border/60 p-2.5 rounded-lg">
                <div>
                  <span className="font-semibold block text-[10px] text-muted-foreground uppercase">Auto Threshold</span>
                  <select
                    value={reminderThreshold}
                    onChange={(e) => {
                      setReminderThreshold(parseInt(e.target.value));
                      setReminderLogs((prev) => [`Threshold changed to £${e.target.value}.00`, ...prev.slice(0, 3)]);
                    }}
                    className="mt-1 border border-border rounded p-1 w-full bg-background outline-none text-xs"
                  >
                    <option value={25}>£25.00</option>
                    <option value={50}>£50.00</option>
                    <option value={75}>£75.00</option>
                  </select>
                </div>
                <div>
                  <span className="font-semibold block text-[10px] text-muted-foreground uppercase">Post-Lesson Days</span>
                  <select
                    value={reminderDays}
                    onChange={(e) => {
                      setReminderDays(parseInt(e.target.value));
                      setReminderLogs((prev) => [`Days limit changed to ${e.target.value} days.`, ...prev.slice(0, 3)]);
                    }}
                    className="mt-1 border border-border rounded p-1 w-full bg-background outline-none text-xs"
                  >
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                  </select>
                </div>
              </div>

              {/* Current state */}
              <div className="text-xs flex justify-between items-center bg-background border border-border/80 p-2.5 rounded-lg shadow-sm">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Mock Student Debt</span>
                  <span className="font-bold text-sm text-foreground">£{(totalOwedCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={checkAutoReminders} className="text-[10px] h-7 cursor-pointer">
                    Run Auto Check
                  </Button>
                  <Button size="sm" variant="outline" onClick={triggerManualReminder} className="text-[10px] h-7 cursor-pointer">
                    Manual Send
                  </Button>
                </div>
              </div>

              {/* Chat View */}
              <div className="space-y-1.5">
                <span className="font-semibold text-[10px] uppercase text-muted-foreground block">Mock Parent Chat Inbox</span>
                <div className="bg-background border border-border/80 rounded-xl p-3 h-[120px] overflow-y-auto space-y-2 flex flex-col text-xs shadow-inner">
                  {simChat.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-xl max-w-[85%] ${
                        msg.sender === "tutor"
                          ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                          : "bg-muted text-muted-foreground mr-auto rounded-tl-none border border-border/60"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-normal text-[10px]">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logs */}
              <div className="space-y-1.5 border-t border-border/60 pt-3">
                <span className="font-semibold text-[10px] uppercase text-muted-foreground block">System Events</span>
                <div className="bg-muted/30 border border-border/40 rounded-lg p-2.5 space-y-1 h-[70px] overflow-y-auto font-mono text-[9px]">
                  {reminderLogs.map((log, i) => (
                    <p key={i} className="text-muted-foreground leading-normal">{log}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === "feedback" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Tutor Notes & Lesson Feedback</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Keep pupil records structured and organized under two distinct concepts:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">General Notes:</strong> For permanent notes (such as year group, academic goals, learning preferences, or temperament) that stay at the top of the student's file.
                </li>
                <li>
                  <strong className="text-foreground">Lesson Feedback:</strong> Formatted rating (1-5 stars) and comments saved for each individual completed lesson booking.
                </li>
                <li>
                  <strong className="text-foreground">Private:</strong> Feedback is private to the tutor's ledger and is not shared with the parent/pupil unless explicitly sent.
                </li>
              </ul>
            </div>
          </div>

          {/* Feedback Simulator */}
          <Card className="yazz-surface border-primary/20">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Notes & Feedback File</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setGeneralNotes("GCSE student working towards Grade 7.");
                    setFeedbacks([{ date: "Wed, 17 Jun", rating: 5, text: "Great focus on simultaneous equations." }]);
                    setFeedbackRating(5);
                    setFeedbackText("Understood algebra equations quickly today!");
                  }}
                  className="size-7"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
              <CardDescription className="text-xs">Simulate tutor notes and lesson logs</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* General notes editor */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Student General Notes</label>
                <input
                  type="text"
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs outline-none focus:border-primary"
                  placeholder="e.g. Year 11, needs focus on algebra"
                />
              </div>

              {/* Add lesson feedback card */}
              <div className="p-3 border border-border bg-muted/10 rounded-xl space-y-3">
                <span className="font-bold text-[10px] uppercase text-primary block">Log Lesson: Sat, 20 Jun</span>
                
                {/* Star rating selection */}
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold text-muted-foreground block">Lesson Rating</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star className="size-4" fill={star <= feedbackRating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback text */}
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold text-muted-foreground block">Lesson Comments</span>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none resize-none focus:border-primary"
                    placeholder="Describe how the lesson went..."
                  />
                </div>

                <Button size="sm" onClick={saveFeedback} className="w-full text-xs h-7.5 cursor-pointer">
                  Save Lesson Log
                </Button>
              </div>

              {/* Render Feedbacks log */}
              <div className="space-y-1.5 border-t border-border/60 pt-3">
                <span className="font-semibold text-[10px] uppercase text-muted-foreground block">Chronological Lesson Log</span>
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {feedbacks.map((f, i) => (
                    <div key={i} className="p-2.5 border border-border/80 rounded-lg text-xs bg-background shadow-xs">
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span>{f.date}</span>
                        <div className="flex gap-0.5 text-amber-500">
                          {Array.from({ length: f.rating }).map((_, starIdx) => (
                            <Star key={starIdx} className="size-3" fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-[11px]">{f.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
