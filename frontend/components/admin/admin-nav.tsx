"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Plus } from "lucide-react";

type AdminNavProps = {
  displayName: string;
  role: string;
};

const NAV_ITEMS = [
  {
    href: "/admin/insights",
    label: "Insights",
    matchPrefix: "/admin/insights",
  },
  { href: "/admin/cards", label: "All cards", matchPrefix: "/admin/cards" },
  {
    href: "/admin/cards/due",
    label: "Due for review",
    matchPrefix: "/admin/cards/due",
  },
  {
    href: "/admin/affirmations",
    label: "Affirmations",
    matchPrefix: "/admin/affirmations",
  },
  { href: "/admin/quotes", label: "Quotes", matchPrefix: "/admin/quotes" },
  {
    href: "/admin/submissions",
    label: "Submissions",
    matchPrefix: "/admin/submissions",
  },
  {
    href: "/admin/reported-issues",
    label: "Reported issues",
    matchPrefix: "/admin/reported-issues",
  },
];

export function AdminNav({ displayName, role }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/88 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <p className="font-display text-lg font-semibold text-sage-dark">
            normal<span className="text-accent">.</span> admin
          </p>
          <p className="font-mono text-[10.5px] uppercase tracking-wide text-ink-secondary">
            {displayName} · {role.replaceAll("_", " ")}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Admin">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin/cards"
                ? pathname === "/admin/cards" ||
                  (pathname.startsWith("/admin/cards/") &&
                    !pathname.startsWith("/admin/cards/due") &&
                    !pathname.startsWith("/admin/cards/new"))
                : item.href === "/admin/affirmations"
                  ? pathname === "/admin/affirmations" ||
                    (pathname.startsWith("/admin/affirmations/") &&
                      !pathname.startsWith("/admin/affirmations/new"))
                  : item.href === "/admin/quotes"
                    ? pathname === "/admin/quotes" ||
                      (pathname.startsWith("/admin/quotes/") &&
                        !pathname.startsWith("/admin/quotes/new"))
                    : pathname === item.href ||
                      pathname.startsWith(`${item.matchPrefix}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-sage-dark text-white"
                    : "border border-border bg-surface text-sage-dark hover:border-sage"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/admin/cards/new"
            className="inline-flex items-center gap-1 rounded-full bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-dark"
          >
            <Plus size={16} aria-hidden="true" />
            New card
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-full border border-border-strong px-4 py-2 text-sm text-sage-dark hover:border-sage"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
