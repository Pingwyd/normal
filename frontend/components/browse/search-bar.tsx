"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchCardSuggestions } from "@/lib/api/cards";
import type { CardSummary } from "@/lib/api/types";
import { buildBrowseHref, withBrowseUpdates } from "@/lib/browse-url";
import type { BrowseSearchParams } from "@/lib/api/types";

type SearchBarProps = {
  initialQuery: string;
  browseParams: BrowseSearchParams;
};

export function SearchBar({ initialQuery, browseParams }: SearchBarProps) {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<CardSummary[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

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

  useEffect(() => {
    const trimmed = query.trim();
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (trimmed.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsSuggesting(true);
      void fetchCardSuggestions(trimmed)
        .then((items) => {
          if (!cancelled) {
            setSuggestions(items);
            setIsOpen(items.length > 0);
            setActiveIndex(-1);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestions([]);
            setIsOpen(false);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSuggesting(false);
          }
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function applyQuery(nextQuery: string) {
    setQuery(nextQuery);
    setIsOpen(false);
    const nextParams = withBrowseUpdates(browseParams, {
      q: nextQuery.trim() || undefined,
      resetPagination: true,
    });
    router.replace(buildBrowseHref(nextParams));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      applyQuery(suggestions[activeIndex].question);
      return;
    }
    applyQuery(query);
  }

  return (
    <div ref={containerRef} className="relative mx-auto max-w-[520px]">
      <form
        onSubmit={handleSubmit}
        className="flex items-center rounded-[14px] border border-border bg-surface px-5 py-1.5 shadow-[0_1px_2px_rgba(32,43,38,0.04)]"
        role="search"
      >
        <label htmlFor="browse-search" className="sr-only">
          Search cards
        </label>
        <input
          id="browse-search"
          type="search"
          role="combobox"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (!isOpen || suggestions.length === 0) {
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) =>
                current >= suggestions.length - 1 ? 0 : current + 1,
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) =>
                current <= 0 ? suggestions.length - 1 : current - 1,
              );
            } else if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder="Type what's on your mind..."
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={isOpen ? listboxId : undefined}
          aria-expanded={isOpen}
          className="min-w-0 flex-1 border-none bg-transparent py-3 text-[15px] text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="rounded-[10px] bg-sage-dark px-5 py-3 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[14px] border border-border bg-surface shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`block w-full px-4 py-3 text-left text-sm ${
                  index === activeIndex
                    ? "bg-surface-muted text-foreground"
                    : "text-ink-secondary hover:bg-surface-muted"
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyQuery(suggestion.question)}
              >
                {suggestion.question}
              </button>
            </li>
          ))}
          {isSuggesting ? (
            <li className="px-4 py-2 text-xs text-muted">Searching...</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
