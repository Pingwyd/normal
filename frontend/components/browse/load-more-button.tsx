import Link from "next/link";

import { buildBrowseHref, withBrowseUpdates } from "@/lib/browse-url";
import type { BrowseSearchParams, PaginationMeta } from "@/lib/api/types";

type LoadMoreButtonProps = {
  browseParams: BrowseSearchParams;
  meta: PaginationMeta | null;
};

export function LoadMoreButton({ browseParams, meta }: LoadMoreButtonProps) {
  if (!meta?.has_more || !meta.next_cursor) {
    return null;
  }

  const href = buildBrowseHref(
    withBrowseUpdates(browseParams, {
      after: meta.next_cursor,
    }),
  );

  return (
    <div className="flex justify-center pt-4">
      <Link
        href={href}
        scroll={false}
        className="rounded-full border border-sage-dark bg-surface px-6 py-3 text-sm font-medium text-sage-dark transition-colors hover:bg-sage-dark hover:text-white"
      >
        Load more
      </Link>
    </div>
  );
}
