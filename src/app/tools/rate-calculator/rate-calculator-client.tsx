"use client";

import React, { useState } from "react";
import { 
  Calculator, 
  Atom, 
  Globe, 
  Music, 
  BookOpen, 
  Compass, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Info, 
  TrendingUp, 
  ShieldCheck, 
  Layers 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { updateTutorRate } from "@/lib/dashboard/profile-actions";
import { useRouter } from "next/navigation";

type SubjectType = "maths" | "science" | "languages" | "music" | "humanities" | "other";
type LevelType = "primary" | "gcse" | "alevel" | "university" | "adult";
type ExperienceType = "student" | "fulltime" | "teacher";
type LocationType = "online" | "london" | "ukregions";

interface Step {
  id: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 1, title: "Subject", description: "What is your main tutoring subject?" },
  { id: 2, title: "Level", description: "What level are you teaching?" },
  { id: 3, title: "Experience", description: "What is your teaching background?" },
  { id: 4, title: "Location", description: "Where will you deliver lessons?" }
];

const getCurrencySymbol = (code: string) => {
  switch (code?.toLowerCase()) {
    case "usd": return "$";
    case "eur": return "€";
    case "gbp": return "£";
    case "cad": return "C$";
    case "aud": return "A$";
    case "inr": return "₹";
    default: return "£";
  }
};

export function RateCalculatorClient({ 
  defaultCurrency = "gbp",
  isDashboard = false
}: { 
  defaultCurrency?: string;
  isDashboard?: boolean;
}) {
  const symbol = getCurrencySymbol(defaultCurrency);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState<SubjectType | "">("");
  const [level, setLevel] = useState<LevelType | "">("");
  const [experience, setExperience] = useState<ExperienceType | "">("");
  const [location, setLocation] = useState<LocationType | "">("");
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const handleApplyToPortal = async () => {
    setIsApplying(true);
    setApplyError(null);
    setApplySuccess(false);
    try {
      const res = await updateTutorRate(baseRate);
      if (res.ok) {
        setApplySuccess(true);
        router.refresh();
      } else {
        setApplyError(res.error || "Failed to apply rate.");
      }
    } catch (err) {
      setApplyError("An unexpected error occurred.");
    } finally {
      setIsApplying(false);
    }
  };

  // Rate Calculation Formula
  const calculateRates = () => {
    if (!subject || !level || !experience || !location) return { min: 20, max: 30, baseRate: 25 };

    // 1. Subject Base Rates
    let base = 25;
    if (subject === "maths" || subject === "science") base = 30;
    else if (subject === "languages" || subject === "music") base = 28;
    else if (subject === "humanities") base = 26;

    // 2. Level Modifiers
    let levelMod = 0;
    if (level === "primary") levelMod = -5;
    else if (level === "gcse") levelMod = 0;
    else if (level === "alevel") levelMod = 6;
    else if (level === "university") levelMod = 14;
    else if (level === "adult") levelMod = 4;

    // 3. Experience Modifiers
    let expMod = 0;
    if (experience === "student") expMod = -5;
    else if (experience === "fulltime") expMod = 10;
    else if (experience === "teacher") expMod = 18;

    // 4. Location Modifiers
    let locMod = 0;
    if (location === "online") locMod = 0;
    else if (location === "london") locMod = 15;
    else if (location === "ukregions") locMod = 5;

    const baseRate = base + levelMod + expMod + locMod;
    const minRange = Math.max(15, baseRate - 5);
    const maxRange = baseRate + 5;

    return { min: minRange, max: maxRange, baseRate };
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setStep(5); // Result Page
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleReset = () => {
    setSubject("");
    setLevel("");
    setExperience("");
    setLocation("");
    setStep(1);
  };

  const { min, max, baseRate } = calculateRates();

  // Custom advisory details based on choices
  const getCustomAdvice = () => {
    const advices = [];
    if (experience === "teacher") {
      advices.push(
        "As a certified school teacher, you command a premium. Pupils are willing to pay higher rates for your deep knowledge of current curricula and marking criteria."
      );
    }
    if (location === "online") {
      advices.push(
        "Online tutoring saves commute time. You can easily schedule back-to-back classes and tutor pupils nationwide, allowing you to sustain high earnings without high travel costs."
      );
    } else if (location === "london") {
      advices.push(
        "London rates are significantly higher due to transport costs and cost of living. Ensure you set a strict cancellation policy to cover your travel time if a student drops out last-minute."
      );
    }
    if (level === "university" || level === "alevel") {
      advices.push(
        "High school exam prep and university tuition are highly structured. Consider selling mock exams, worksheets, or notes as digital goods to complement your hours."
      );
    } else if (level === "primary") {
      advices.push(
        "Primary pupils require highly interactive materials. Offering small group classes (e.g. 3-4 pupils at a lower per-child rate) can actually double your hourly rate while saving parents money."
      );
    }
    
    // Fallback general advice
    if (advices.length === 0) {
      advices.push(
        "We recommend pre-billing clients upfront. Charging block fees (e.g., 5-lesson credits) rather than pay-as-you-go helps secure student commitment and reduces empty slots."
      );
    }

    return advices;
  };

  // Determine pricing band name
  const getPricingBand = (rate: number) => {
    if (rate < 25) return { name: "Budget/Starter", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
    if (rate >= 25 && rate < 45) return { name: "Average/Competitive", color: "text-teal-500 bg-teal-500/10 border-teal-500/20" };
    if (rate >= 45 && rate < 65) return { name: "Experienced Professional", color: "text-violet-500 bg-violet-500/10 border-violet-500/20" };
    return { name: "Premium Specialist", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
  };

  const pricingBand = getPricingBand(baseRate);

  return (
    <div className="py-10">
      <div className="yazz-container max-w-3xl">
        
        {/* Eyebrow & Title */}
        <div className="mb-8 text-center">
          <span className="yazz-eyebrow mb-3">Interactive Tool</span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tutor <span className="yazz-gradient-text">Rate Calculator</span>
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Calculate your ideal hourly tuition rate based on subject matter, academic levels, teaching experience, and location.
          </p>
        </div>

        {/* Step Progress Bar (hidden on result step) */}
        {step <= 4 && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-semibold px-1">
              <span>Step {step} of 4: {STEPS[step - 1].title}</span>
              <span>{Math.round(((step - 1) / 4) * 100)}% Complete</span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Wizard Main Card */}
        <div className="yazz-surface p-6 sm:p-8 min-h-[380px] flex flex-col justify-between">
          
          {/* STEP 1: SUBJECT */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">{STEPS[0].description}</h2>
                <p className="text-xs text-muted-foreground">Select the category that best matches your tutoring focus.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { id: "maths", label: "Mathematics", desc: "Algebra, calculus, stats", icon: Calculator },
                  { id: "science", label: "Sciences", desc: "Physics, chemistry, biology", icon: Atom },
                  { id: "languages", label: "Languages", desc: "Spanish, French, English, etc.", icon: Globe },
                  { id: "music", label: "Music & Drama", desc: "Instruments, theory, vocals", icon: Music },
                  { id: "humanities", label: "Humanities", desc: "History, geography, lit", icon: BookOpen },
                  { id: "other", label: "Other / Creative", desc: "Coding, business, art", icon: Compass }
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = subject === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSubject(opt.id as SubjectType)}
                      className={`text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between h-32 relative ${
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                          : "border-border/60 bg-card/50 hover:bg-muted hover:border-primary/25"
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <div className={`p-2 rounded-lg bg-card border border-border/80 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                          <Icon className="size-5" />
                        </div>
                        {isSelected && (
                          <span className="size-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                            <Check className="size-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-foreground leading-tight">{opt.label}</span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: LEVEL */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">{STEPS[1].description}</h2>
                <p className="text-xs text-muted-foreground">Select the target student demographic you will tutor.</p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {[
                  { id: "primary", label: "Primary / Elementary School", desc: "Pupils aged 5 – 11 (Key Stages 1 & 2 or equivalent)" },
                  { id: "gcse", label: "GCSE / Middle School", desc: "Students aged 11 – 16 (Key Stage 3 & 4 exam preparation)" },
                  { id: "alevel", label: "A-Level / High School", desc: "Students aged 16 – 18 (Key Stage 5, AP exams, or IB prep)" },
                  { id: "university", label: "University & Higher Education", desc: "Undergraduates, postgraduates, and academic thesis coaching" },
                  { id: "adult", label: "Adult Learners & Professional", desc: "Language learning, professional exams, or vocational skills" }
                ].map((opt) => {
                  const isSelected = level === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setLevel(opt.id as LevelType)}
                      className={`text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                          : "border-border/60 bg-card/50 hover:bg-muted hover:border-primary/25"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                      </div>
                      <div className={`size-5 rounded-full border flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-border"}`}>
                        {isSelected && <div className="size-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: EXPERIENCE */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">{STEPS[2].description}</h2>
                <p className="text-xs text-muted-foreground">Select the background that matches your teaching credentials.</p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {[
                  { 
                    id: "student", 
                    label: "Undergraduate / Student Tutor", 
                    desc: "Currently enrolled in university or a recent graduate tutoring part-time." 
                  },
                  { 
                    id: "fulltime", 
                    label: "Professional Private Tutor", 
                    desc: "Dedicated self-employed private educator with substantial tutoring hours and success stories." 
                  },
                  { 
                    id: "teacher", 
                    label: "Qualified School Teacher", 
                    desc: "Holds recognized teaching credentials (PGCE, QTS, etc.) with professional school classroom experience." 
                  }
                ].map((opt) => {
                  const isSelected = experience === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setExperience(opt.id as ExperienceType)}
                      className={`text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                          : "border-border/60 bg-card/50 hover:bg-muted hover:border-primary/25"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                      </div>
                      <div className={`size-5 rounded-full border flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-border"}`}>
                        {isSelected && <div className="size-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: LOCATION */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">{STEPS[3].description}</h2>
                <p className="text-xs text-muted-foreground">Select the primary medium/location for your lessons.</p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {[
                  { 
                    id: "online", 
                    label: "Online / Remote", 
                    desc: "Tutor students over Zoom, Teams, Google Meet, or interactive online boards (no travel required)." 
                  },
                  { 
                    id: "london", 
                    label: "Greater London Area (In-person)", 
                    desc: "Face-to-face classes at pupil home or a public library in London (higher travel time & expenses)." 
                  },
                  { 
                    id: "ukregions", 
                    label: "UK Regions & Local Cities (In-person)", 
                    desc: "In-person classes at pupil location in other UK towns, cities, or regions." 
                  }
                ].map((opt) => {
                  const isSelected = location === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setLocation(opt.id as LocationType)}
                      className={`text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                          : "border-border/60 bg-card/50 hover:bg-muted hover:border-primary/25"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                      </div>
                      <div className={`size-5 rounded-full border flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-border"}`}>
                        {isSelected && <div className="size-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: RESULTS SCREEN */}
          {step === 5 && (
            <div className="space-y-6">
              
              {/* Top Summary Banner */}
              <div className="text-center space-y-1.5 pb-4 border-b border-border/50">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Recommended Hourly Rate</span>
                
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {symbol}{min} – {symbol}{max}
                  </span>
                  <span className="text-lg text-muted-foreground self-end mb-1">/ hour</span>
                </div>

                <div className="inline-flex mt-2">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${pricingBand.color}`}>
                    {pricingBand.name} Band
                  </span>
                </div>
              </div>

              {/* Selection Summary Tags */}
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50 flex flex-wrap gap-2 justify-center">
                <span className="text-[10px] font-semibold bg-card px-2.5 py-1 rounded-lg border border-border capitalize">
                  Subject: {subject}
                </span>
                <span className="text-[10px] font-semibold bg-card px-2.5 py-1 rounded-lg border border-border capitalize">
                  Level: {level === "alevel" ? "A-Level" : level === "gcse" ? "GCSE" : level}
                </span>
                <span className="text-[10px] font-semibold bg-card px-2.5 py-1 rounded-lg border border-border capitalize">
                  Background: {experience === "student" ? "Undergrad" : experience === "fulltime" ? "Professional" : "QTS Teacher"}
                </span>
                <span className="text-[10px] font-semibold bg-card px-2.5 py-1 rounded-lg border border-border capitalize">
                  Format: {location === "ukregions" ? "UK Region" : location}
                </span>
              </div>

              {/* Advisory Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="size-4 text-primary" /> Personalized Pricing Tips
                </h3>
                
                <ul className="space-y-2.5 text-xs text-muted-foreground pl-1">
                  {getCustomAdvice().map((advice, i) => (
                    <li key={i} className="flex gap-2 items-start leading-relaxed">
                      <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* General Tutor Business Checklist */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-border/80 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-500" /> Best Practices for Charging Pupils
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span className="text-muted-foreground leading-normal">
                      <strong className="text-foreground">Upfront billing:</strong> Never teach a lesson before securing payment. Collect cards or bank transfers beforehand.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span className="text-muted-foreground leading-normal">
                      <strong className="text-foreground">24h cancel policy:</strong> Lock booking times and bill 100% of the session cost if cancelled with less than 24 hours notice.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span className="text-muted-foreground leading-normal">
                      <strong className="text-foreground">Block bookings:</strong> Sell 5 or 10 lesson packs with a 5% discount to lock in commitment and save time.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span className="text-muted-foreground leading-normal">
                      <strong className="text-foreground">Passive revenue:</strong> Bundle custom homework PDF sheets and sell them to boost revenue.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Footer Controls */}
          <div className="mt-8 pt-4 border-t border-border/50 flex justify-between items-center gap-3">
            
            {/* Left aligned Back button */}
            {step > 1 && step <= 4 ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBack}
                className="text-xs"
              >
                <ArrowLeft className="size-3.5 mr-1" /> Back
              </Button>
            ) : step === 5 ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="text-xs text-muted-foreground"
              >
                Recalculate
              </Button>
            ) : (
              <div /> // placeholder
            )}

            {/* Right aligned Continue button */}
            {step <= 4 ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleNext}
                disabled={
                  (step === 1 && !subject) ||
                  (step === 2 && !level) ||
                  (step === 3 && !experience) ||
                  (step === 4 && !location)
                }
                className="yazz-btn-primary h-8 font-semibold px-4 text-xs ml-auto"
              >
                Continue <ArrowRight className="size-3.5 ml-1" />
              </Button>
            ) : isDashboard ? (
              <div className="flex flex-col items-end gap-1.5 ml-auto">
                {applySuccess && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Hourly rate applied to your profile!
                  </span>
                )}
                {applyError && (
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    ⚠️ {applyError}
                  </span>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApplyToPortal}
                  disabled={isApplying || applySuccess}
                  className="yazz-btn-primary h-8 font-semibold px-4 text-xs animate-pulse"
                >
                  {isApplying ? "Applying..." : applySuccess ? "Applied!" : "Apply to my portal"}
                  <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </div>
            ) : (
              <Link
                href="/auth/signup"
                className="inline-flex h-8 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-[0_4px_20px_oklch(0.55_0.18_250/0.3)] transition duration-300 hover:-translate-y-0.5 hover:bg-[oklch(0.50_0.18_250)] hover:shadow-[0_8px_32px_oklch(0.55_0.18_250/0.4)]"
              >
                Claim Your Tutor Portal <ArrowRight className="size-3.5 ml-1" />
              </Link>
            )}

          </div>

        </div>

        {/* Post-results brand promotion block */}
        {!isDashboard && (
          <div className="mt-6 p-6 bg-gradient-to-br from-primary/10 to-indigo-600/5 border border-primary/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="size-20 text-primary" />
            </div>
            
            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary animate-pulse" /> Launch Your Private Tutoring Brand
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Running a tutor business shouldn't mean wasting hours on schedules, WhatsApp bookings, or manually chasing parents for payments. Yazzow sets up a beautiful public workspace with your branding, lets clients book slot calendars upfront via card/Stripe, and delivers auto-invoices.
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link 
                href="/auth/signup"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-all hover:bg-[oklch(0.50_0.18_250)]"
              >
                Get Started Free <ArrowRight className="size-3 ml-1" />
              </Link>
              <Link 
                href="/#pricing"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card/80 px-4 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                Pricing & Features
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
