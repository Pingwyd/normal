"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { buildBrowseHref, withBrowseUpdates } from "@/lib/browse-url";
import type { BrowseSearchParams } from "@/lib/api/types";

type SearchBarProps = {
  initialQuery: string;
  browseParams: BrowseSearchParams;
};

export function SearchBar({ initialQuery, browseParams }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const trimmed = query.trim();
    const current = browseParams.q?.trim() ?? "";
    if (trimmed === current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextParams = withBrowseUpdates(browseParams, {
        q: trimmed || undefined,
        resetPagination: true,
      });
      router.replace(buildBrowseHref(nextParams));
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [browseParams, query, router]);

  return (
    <label className="relative block">
      <span className="sr-only">Search cards</span>
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6560]"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search worries, like feeling anxious..."
        className="w-full rounded-full border border-[#CFCBC2] bg-white py-3 pl-11 pr-4 text-sm text-[#202B26] outline-none ring-[#4B6B5E] placeholder:text-[#7A8480] focus:ring-2"
      />
    </label>
  );
}
