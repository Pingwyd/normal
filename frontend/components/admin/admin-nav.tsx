"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Plus } from "lucide-react";

type AdminNavProps = {
  displayName: string;
  role: string;
};

const NAV_ITEMS = [
  { href: "/admin/cards", label: "All cards" },
  { href: "/admin/cards/due", label: "Due for review" },
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
    <header className="border-b border-[#D8D5CC] bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <p className="font-display text-lg text-[#202B26]">Admin</p>
          <p className="text-xs text-[#5A6560]">
            {displayName} ({role.replaceAll("_", " ")})
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Admin">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-[#33473D] text-white"
                    : "border border-[#CFCBC2] text-[#33473D] hover:border-[#4B6B5E]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/admin/cards/new"
            className="inline-flex items-center gap-1 rounded-full bg-[#4B6B5E] px-4 py-2 text-sm font-medium text-white hover:bg-[#33473D]"
          >
            <Plus size={16} aria-hidden="true" />
            New card
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-full border border-[#CFCBC2] px-4 py-2 text-sm text-[#33473D] hover:border-[#4B6B5E]"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
