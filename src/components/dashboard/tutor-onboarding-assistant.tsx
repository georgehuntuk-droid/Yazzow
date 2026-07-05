"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Sparkles, 
  Settings, 
  CalendarRange, 
  Calendar,
  CreditCard, 
  BookOpen, 
  X, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Circle,
  HelpCircle,
  Trophy,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingProgress } from "@/lib/tutors/queries";

type TutorOnboardingAssistantProps = {
  status: OnboardingProgress | null;
};

export function TutorOnboardingAssistant({ status }: TutorOnboardingAssistantProps) {
  const pathname = usePathname();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check local storage states
    const dismissed = localStorage.getItem("yazzow_onboarding_dismissed") === "true";
    const closedBefore = localStorage.getItem("yazzow_onboarding_closed") === "true";
    
    setIsDismissed(dismissed);
    
    // Auto-open on dashboard if not dismissed, not closed before, and not 100% complete
    if (!dismissed && !closedBefore && status && status.completedSteps < status.totalSteps) {
      setIsOpen(true);
    }
  }, [status]);

  if (!isMounted || !status) return null;

  // If 100% complete, let's keep the helper but in a mini state, or celebrate!
  const isAllComplete = status.completedSteps === status.totalSteps;

  const percentComplete = Math.round((status.completedSteps / status.totalSteps) * 100);

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (!nextState) {
      localStorage.setItem("yazzow_onboarding_closed", "true");
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("yazzow_onboarding_dismissed", "true");
  };

  const handleResetDismiss = () => {
    setIsDismissed(false);
    setIsOpen(true);
    localStorage.removeItem("yazzow_onboarding_dismissed");
    localStorage.removeItem("yazzow_onboarding_closed");
  };

  // If fully dismissed, we still render a tiny floating badge that allows them to re-open it
  if (isDismissed) {
    return (
      <button
        onClick={handleResetDismiss}
        className="fixed bottom-5 right-5 z-40 flex items-center justify-center size-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 hover:bg-primary/95 transition-all duration-300 cursor-pointer group"
        title="Tutor Onboarding Guide"
      >
        <Sparkles className="size-5 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  // Context-specific helper content based on the active path
  const getContextualTip = () => {
    if (pathname.includes("/dashboard/settings")) {
      return {
        title: "Portal Customization Tip",
        tip: "Upload a high-quality profile picture, set your desired hourly rate, and write a compelling bio detailing your qualifications and methodology. This profile is your main storefront for parents!",
      };
    }
    if (pathname.includes("/dashboard/schedule")) {
      return {
        title: "Schedule Setup Tip",
        tip: "Click and drag directly on the calendar or click the 'Add Slots' button to specify when you're free. Parents see these slots as real-time booking options, letting them secure lessons in seconds.",
      };
    }
    if (pathname.includes("/dashboard/payments")) {
      return {
        title: "Payments Setup Tip",
        tip: "Subscribe to Yazzow to activate portal checkouts. Once subscribed, link your Stripe account. Stripe payouts land directly in your bank account, and billing notifications are handled inside the in-app chat.",
      };
    }
    if (pathname.includes("/dashboard/storefront")) {
      return {
        title: "Shop Manager Tip",
        tip: "Upload resources like homework packages, worksheet sets, or syllabus files. Set a subject tag and price, and they will automatically display on your public shelf for families to view or purchase.",
      };
    }
    // Default dashboard tip
    return {
      title: "Quick Welcome Guide",
      tip: "Welcome to Yazzow! Work through this 4-step checklist to launch your tutoring workspace. You can keep this panel open as you navigate to different pages for context-specific tips.",
    };
  };

  const currentTip = getContextualTip();

  const steps = [
    {
      id: "profile",
      title: "Customize Tutor Portal",
      desc: "Upload photo, bio, and hourly rate",
      completed: status.isProfileCustomized,
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      id: "schedule",
      title: "Define Availability",
      desc: "Add free slots to calendar builder",
      completed: status.isScheduleSetup,
      href: "/dashboard/schedule",
      icon: CalendarRange,
    },
    {
      id: "stripe",
      title: "Connect Stripe Payouts",
      desc: "Subscribe & link your bank payout",
      completed: status.isStripeConnected,
      href: "/dashboard/payments",
      icon: CreditCard,
    },
    {
      id: "storefront",
      title: "Stock Your Shop Shelf",
      desc: "Upload learning resources (optional)",
      completed: status.isStorefrontSetup,
      href: "/dashboard/storefront",
      icon: BookOpen,
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm w-[350px] font-sans">
      {/* Collapsed view badge */}
      {!isOpen && (
        <button
          onClick={handleToggleOpen}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary via-indigo-600 to-primary text-primary-foreground shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-300 cursor-pointer font-semibold text-xs border border-primary/20"
        >
          <Sparkles className="size-4 animate-pulse" />
          <span>Setup Guide</span>
          <span className="bg-primary-foreground/20 px-1.5 py-0.5 rounded-md text-[10px]">
            {status.completedSteps}/{status.totalSteps}
          </span>
          <ChevronUp className="size-3.5" />
        </button>
      )}

      {/* Expanded panel view */}
      {isOpen && (
        <div className="rounded-2xl border border-primary/20 bg-background/95 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 via-indigo-500/10 to-primary/10 p-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="size-4 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">Tutor Setup Guide</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Quick setup checklist</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleToggleOpen}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
                title="Minimize Guide"
              >
                <ChevronDown className="size-4" />
              </button>
              <button 
                onClick={handleDismiss}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
                title="Dismiss Guide Permanently"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Progress Section */}
          <div className="px-4 pt-3.5 pb-2 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-foreground">Setup Progress</span>
              <span className="text-primary font-bold">{percentComplete}%</span>
            </div>
            <div className="w-full bg-primary/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 rounded-full" 
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Checklist Items */}
          <div className="p-2 space-y-1 max-h-[220px] overflow-y-auto">
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className={`flex items-start gap-2.5 p-2 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all group ${
                    pathname === step.href ? "bg-primary/[0.02] border-primary/20" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {step.completed ? (
                      <CheckCircle2 className="size-4.5 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <Circle className="size-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div className="space-y-0.5 text-left flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold truncate ${step.completed ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary transition-colors"}`}>
                        {step.title}
                      </span>
                      <StepIcon className={`size-3 shrink-0 ${pathname === step.href ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate font-medium">
                      {step.desc}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="size-3 text-primary" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Context tip box */}
          <div className="mx-4 my-2 p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1">
            <div className="flex items-center gap-1 text-primary">
              <HelpCircle className="size-3.5 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{currentTip.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
              {currentTip.tip}
            </p>
          </div>

          {/* Celebratory Footer if 100% complete */}
          {isAllComplete && (
            <div className="m-4 mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-emerald-500">
                <Trophy className="size-4 shrink-0" />
                <span className="text-xs font-black">All Steps Complete!</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal font-semibold">
                Your portal is fully optimized. You are ready to accept bookings!
              </p>
            </div>
          )}

          {/* Footer controls */}
          <div className="px-4 py-2 bg-muted/20 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Yazzow Onboarding Copilot</span>
            <button
              onClick={handleDismiss}
              className="font-semibold text-primary hover:underline transition-all cursor-pointer"
            >
              Dismiss checklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
