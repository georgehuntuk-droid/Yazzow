import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResourceCheckoutButton } from "@/components/tutor/resource-checkout-button";
import { formatMoney } from "@/lib/format";
import type { DigitalResource } from "@/lib/types";

type ResourceShelfProps = {
  resources: DigitalResource[];
  tutorUsername: string;
  paymentsEnabled?: boolean;
};

export function ResourceShelf({
  resources,
  tutorUsername,
  paymentsEnabled = true,
}: ResourceShelfProps) {
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
          <CardFooter className="flex flex-col gap-3 border-t border-border/60 pt-4">
            <span className="w-full text-lg font-semibold text-primary">
              {formatMoney(resource.priceCents, resource.currency)}
            </span>
            {paymentsEnabled ? (
              <ResourceCheckoutButton resource={resource} tutorUsername={tutorUsername} />
            ) : (
              <p className="text-sm text-muted-foreground">Purchases opening soon.</p>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
