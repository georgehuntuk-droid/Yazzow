import { BookOpen, Trophy, Globe, Music, Check } from "lucide-react";
import { SpotlightCard } from "@/components/brand/spotlight-card";

const audiences = [
  {
    icon: BookOpen,
    accentClass: "from-violet-500/20 to-indigo-500/5 text-violet-600 dark:text-violet-400 ring-violet-500/15",
    glowClass: "bg-violet-500/10",
    title: "Academic Tutors",
    subtitle: "Maths, Science, Humanities",
    benefits: [
      "Set precise availability blocks",
      "Automated cancellation rebooking",
      "List resources & mock exam papers",
    ],
  },
  {
    icon: Trophy,
    accentClass: "from-amber-500/20 to-yellow-500/5 text-amber-600 dark:text-amber-400 ring-amber-500/15",
    glowClass: "bg-amber-500/10",
    title: "Test Prep Coaches",
    subtitle: "GCSE, A-Levels, SATs",
    benefits: [
      "Sell lesson bundles upfront",
      "No directory commission fees",
      "Instant email alerts to parents",
    ],
  },
  {
    icon: Globe,
    accentClass: "from-teal-500/20 to-emerald-500/5 text-teal-600 dark:text-teal-400 ring-teal-500/15",
    glowClass: "bg-teal-500/10",
    title: "Language Instructors",
    subtitle: "ESL, Modern Languages",
    benefits: [
      "Custom student billing currencies",
      "Easy rescheduling features",
      "No account required for parents",
    ],
  },
  {
    icon: Music,
    accentClass: "from-rose-500/20 to-pink-500/5 text-rose-600 dark:text-rose-400 ring-rose-500/15",
    glowClass: "bg-rose-500/10",
    title: "Music & Arts Teachers",
    subtitle: "Instruments, Singing, Arts",
    benefits: [
      "Strict cancellation window policies",
      "Sell practice guides & PDFs",
      "Clean visual student roster list",
    ],
  },
] as const;

export function MarketingAudience() {
  return (
    <section id="audience" className="relative py-20 sm:py-24 overflow-hidden bg-background">
      {/* Background radial glow */}
      <div className="absolute right-0 top-1/3 size-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" aria-hidden />
      <div className="absolute left-0 bottom-10 size-80 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" aria-hidden />

      <div className="yazz-container relative">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="yazz-section-label">Tailored for you</p>
          <h2 className="font-heading text-3xl font-black tracking-tight sm:text-4xl">
            Designed for every type of educator
          </h2>
          <p className="mt-4 yazz-muted text-base">
            Whether you teach algebra, physics, conversational French, or piano, Yazzow gives you a private, distraction-free home for your teaching business.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((aud) => (
            <SpotlightCard key={aud.title} className="flex h-full flex-col p-6 group transition-all duration-300 hover:scale-[1.02]">
              {/* Colored Glow Backdrop inside the card */}
              <div className={`absolute -right-8 -top-8 size-24 rounded-full ${aud.glowClass} blur-xl opacity-60 transition duration-300 group-hover:opacity-100`} />

              <div className={`mb-5 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-primary ring-1 transition duration-300 group-hover:scale-110 ${aud.accentClass}`}>
                <aud.icon className="size-5" />
              </div>

              <div className="mb-4">
                <h3 className="font-heading text-lg font-black tracking-tight text-foreground">{aud.title}</h3>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">{aud.subtitle}</p>
              </div>

              <ul className="mt-auto space-y-2.5 border-t border-border/50 pt-4">
                {aud.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <Check className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
