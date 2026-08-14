import Link from "next/link";

import type { ReflectionTag } from "@/lib/api/reflection-types";

type ReflectionTagChipsProps = {
  tags: ReflectionTag[];
  activeTag?: string;
};

function buildHref(tag?: string): string {
  if (!tag) {
    return "/reflections";
  }
  return `/reflections?tag=${encodeURIComponent(tag)}`;
}

export function ReflectionTagChips({ tags, activeTag }: ReflectionTagChipsProps) {
  if (tags.length === 0) {
    return null;
  }

  const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      className="flex flex-wrap gap-2.5"
      role="group"
      aria-label="Filter by tag"
    >
      <Link
        href={buildHref()}
        scroll={false}
        className={`whitespace-nowrap rounded-full border px-4 py-2 text-[13.5px] transition-colors ${
          !activeTag
            ? "border-sage-dark bg-sage-dark text-white"
            : "border-border bg-surface text-ink-secondary hover:border-sage"
        }`}
        aria-current={!activeTag ? "true" : undefined}
      >
        All
      </Link>
      {sorted.map((tag) => {
        const isActive = activeTag === tag.name;
        return (
          <Link
            key={tag.id}
            href={buildHref(tag.name)}
            scroll={false}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-[13.5px] transition-colors ${
              isActive
                ? "border-sage-dark bg-sage-dark text-white"
                : "border-border bg-surface text-ink-secondary hover:border-sage"
            }`}
            aria-current={isActive ? "true" : undefined}
          >
            {tag.name}
          </Link>
        );
      })}
    </div>
  );
}
