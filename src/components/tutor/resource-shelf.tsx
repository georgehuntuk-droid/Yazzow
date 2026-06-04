import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { DigitalResource } from "@/lib/types";

type ResourceShelfProps = {
  resources: DigitalResource[];
};

export function ResourceShelf({ resources }: ResourceShelfProps) {
  if (resources.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
        No worksheet packs listed yet.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {resources.map((resource) => (
        <Card key={resource.id} className="yazz-surface flex flex-col">
          <div className="mx-6 mt-6 flex h-32 items-center justify-center rounded-xl bg-secondary/60">
            <span className="font-heading text-sm font-medium text-muted-foreground">
              Worksheet pack
            </span>
          </div>
          <CardHeader>
            <CardTitle className="font-heading text-lg">{resource.title}</CardTitle>
            <CardDescription>{resource.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1" />
          <CardFooter className="flex flex-col gap-2 border-t border-border/60 pt-4">
            {resource.priceCents > 0 ? (
              <span className="w-full text-lg font-semibold text-primary">
                {formatMoney(resource.priceCents, resource.currency)}
              </span>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Message your tutor to arrange payment and receive this pack — purchases are not
              processed on Yazzow.
            </p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
