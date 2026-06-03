import { Quote } from "lucide-react";

import { SpotlightCard } from "@/components/brand/spotlight-card";

const testimonials = [
  {
    quote:
      "I stopped worrying about parents comparing me to ten other tutors on the same page. My link feels like my studio.",
    name: "Maya Chen",
    role: "GCSE Maths · London",
    initials: "MC",
  },
  {
    quote:
      "Selling revision packs alongside bookings was the missing piece. One link, two income streams — and the fees are actually fair.",
    name: "James Okonkwo",
    role: "A-Level Physics · Manchester",
    initials: "JO",
  },
  {
    quote:
      "Setup took an hour. I sent my portal link to three families that evening and had two bookings by morning.",
    name: "Priya Sharma",
    role: "Primary English · Birmingham",
    initials: "PS",
  },
] as const;

export function MarketingTestimonials() {
  return (
    <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
      <div className="yazz-container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="yazz-section-label">Tutor stories</p>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Built for educators who already have a following
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <SpotlightCard key={item.name} className="flex flex-col p-6">
              <Quote className="mb-4 size-8 text-primary/30" aria-hidden />
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border/50 pt-5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-bold text-primary ring-1 ring-primary/15">
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </figcaption>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
