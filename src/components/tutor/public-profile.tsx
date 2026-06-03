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

  return (
    <div className="yazz-surface overflow-hidden">
      <div
        className="h-24 bg-gradient-to-r from-primary/15 via-secondary/40 to-primary/5 sm:h-32"
        style={
          tutor.coverUrl
            ? {
                backgroundImage: `linear-gradient(to bottom, oklch(0.2 0.02 62 / 0.15), oklch(0.2 0.02 62 / 0.45)), url(${tutor.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />
      <div className="relative px-6 pb-6 sm:px-8">
        <div className="-mt-10 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:gap-6">
          <Avatar className="size-20 border-4 border-card shadow-md sm:size-24">
            {tutor.avatarUrl ? (
              <AvatarImage src={tutor.avatarUrl} alt={tutor.displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 font-heading text-xl font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-1">
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
              {tutor.displayName}
            </h1>
            {tutor.headline ? (
              <p className="mt-1 text-base text-muted-foreground">{tutor.headline}</p>
            ) : null}
          </div>
        </div>
        {tutor.bio ? (
          <p className="mt-5 max-w-2xl leading-relaxed text-foreground/90">{tutor.bio}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            {formatMoney(tutor.lessonPriceCents, tutor.currency)} per lesson
          </Badge>
          <Badge variant="secondary">Paid upfront at booking</Badge>
        </div>
      </div>
    </div>
  );
}
