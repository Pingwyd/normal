import Link from "next/link";

import type { PaginationMeta } from "@/lib/api/types";

type ReflectionsLoadMoreProps = {
  meta: PaginationMeta | null;
  tag?: string;
};

function buildHref(after: string, tag?: string): string {
  const search = new URLSearchParams();
  if (tag) {
    search.set("tag", tag);
  }
  search.set("after", after);
  return `/reflections?${search.toString()}`;
}

export function ReflectionsLoadMore({ meta, tag }: ReflectionsLoadMoreProps) {
  if (!meta?.has_more || !meta.next_cursor) {
    return null;
  }

  return (
    <div className="flex justify-center pt-6">
      <Link
        href={buildHref(meta.next_cursor, tag)}
        scroll={false}
        className="rounded-full border border-sage-dark bg-surface px-6 py-3 text-sm font-medium text-sage-dark transition-colors hover:bg-sage-dark hover:text-white"
      >
        Load more
      </Link>
    </div>
  );
}
