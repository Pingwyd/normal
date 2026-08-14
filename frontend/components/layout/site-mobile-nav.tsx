"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const MOBILE_LINKS = [
  { href: "/", label: "Browse" },
  { href: "/reflections", label: "Reflections" },
  { href: "/affirmations", label: "Affirmations" },
  { href: "/quotes", label: "Quotes" },
  { href: "/suggest", label: "Submit a question" },
  { href: "/account/saved", label: "Saved" },
  { href: "/account/settings", label: "Settings" },
  { href: "/account/login", label: "Sign in" },
];

export function SiteMobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-sage-dark"
        aria-expanded={isOpen}
        aria-controls="site-mobile-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? (
          <X size={18} aria-hidden="true" />
        ) : (
          <Menu size={18} aria-hidden="true" />
        )}
      </button>

      {isOpen ? (
        <nav
          id="site-mobile-menu"
          aria-label="Mobile"
          className="absolute inset-x-0 top-16 border-b border-border bg-background/98 px-4 py-4 backdrop-blur-sm"
        >
          <ul className="space-y-1">
            {MOBILE_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-sage-dark text-white"
                        : "text-ink-secondary hover:bg-surface-muted"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
