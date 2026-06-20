import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import type { TutorProfile } from "@/lib/types";

type PublicProfileProps = {
  tutor: TutorProfile;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PublicProfile({ tutor }: PublicProfileProps) {
  const initials = getInitials(tutor.displayName);

  // Dynamic JSON-LD Structured Data Schema.org Person/Tutor profile markup
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Tutor",
    "name": tutor.displayName,
    "description": tutor.headline || tutor.bio || `${tutor.displayName} - Private Tutor on Yazzow`,
    "url": `https://yazzow.com/tutor/${tutor.username}`,
    "image": tutor.avatarUrl || "https://yazzow.com/icon.png",
    "priceRange": `${formatMoney(tutor.lessonPriceCents, tutor.currency)} / hr`,
    "offers": {
      "@type": "Offer",
      "price": (tutor.lessonPriceCents / 100).toFixed(2),
      "priceCurrency": tutor.currency.toUpperCase(),
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <div className="yazz-surface overflow-hidden transition-all duration-300 hover:border-primary/20 shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
      {/* Inject Structured Schema JSON-LD for rich snippets on Google Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div
        className="h-24 bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/35 sm:h-32 relative overflow-hidden"
        style={
          tutor.coverUrl
            ? {
                backgroundImage: `linear-gradient(to bottom, oklch(0.2 0.02 62 / 0.15), oklch(0.2 0.02 62 / 0.45)), url(${tutor.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {/* Cover Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,var(--primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--primary)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
      
      <div className="relative px-6 pb-6 sm:px-8">
        <div className="-mt-10 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:gap-6">
          <Avatar className="size-20 border-4 border-card shadow-[0_0_15px_var(--primary)] sm:size-24 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_22px_var(--primary)] relative z-10">
            {tutor.avatarUrl ? (
              <AvatarImage src={tutor.avatarUrl} alt={tutor.displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 font-heading text-xl font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-1">
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              {tutor.displayName}
            </h1>
            {tutor.headline ? (
              <p className="mt-1 text-base font-medium text-muted-foreground">{tutor.headline}</p>
            ) : null}
          </div>
        </div>
        {tutor.portalWelcomeMessage ? (
          <div className="mt-5 max-w-2xl rounded-xl border border-primary/15 border-l-4 border-l-primary bg-primary/[0.02] px-4 py-3.5 text-base leading-relaxed text-foreground/90 backdrop-blur-sm shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
            {tutor.portalWelcomeMessage}
          </div>
        ) : null}
        {tutor.bio ? (
          <p className="mt-5 max-w-2xl leading-relaxed text-foreground/80">{tutor.bio}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-all duration-200">
            {formatMoney(tutor.lessonPriceCents, tutor.currency)} per lesson
          </Badge>
          <Badge variant="secondary" className="border border-border/60 hover:bg-muted transition-all duration-200">
            Paid upfront at booking
          </Badge>
        </div>
      </div>
    </div>
  );
}
