import Link from "next/link";

import { BROWSE_CATEGORIES } from "@/lib/browse-categories";
import { buildBrowseHref, withBrowseUpdates } from "@/lib/browse-url";
import type { BrowseSearchParams } from "@/lib/api/types";

type CategoryChipsProps = {
  browseParams: BrowseSearchParams;
};

export function CategoryChips({ browseParams }: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
      {BROWSE_CATEGORIES.map((category) => {
        const isActive =
          (category.slug ?? undefined) === (browseParams.category ?? undefined);
        const href = buildBrowseHref(
          withBrowseUpdates(browseParams, {
            category: category.slug ?? undefined,
            resetPagination: true,
          }),
        );

        return (
          <Link
            key={category.name}
            href={href}
            scroll={false}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-sage-dark text-white"
                : "border border-border-strong bg-surface text-sage-dark hover:border-sage"
            }`}
            aria-current={isActive ? "true" : undefined}
          >
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
