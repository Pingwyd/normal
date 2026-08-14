import type { ReflectionSummary } from "@/lib/api/reflection-types";

import { ReflectionSummaryTile } from "./reflection-summary-tile";

type ReflectionGridProps = {
  reflections: ReflectionSummary[];
};

export function ReflectionGrid({ reflections }: ReflectionGridProps) {
  if (reflections.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
        <p className="font-display text-lg text-foreground">
          No reflections yet
        </p>
        <p className="mt-2 text-sm text-muted">
          Check back soon, or try clearing your tag filter.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {reflections.map((reflection) => (
        <li key={reflection.id} className="min-h-0">
          <ReflectionSummaryTile reflection={reflection} />
        </li>
      ))}
    </ul>
  );
}
