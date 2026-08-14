import Link from "next/link";

import { AccountMenu } from "@/components/account/account-menu";
import { SiteMobileNav } from "@/components/layout/site-mobile-nav";

const DESKTOP_LINKS = [
  { href: "/", label: "Browse" },
  { href: "/reflections", label: "Reflections" },
  { href: "/affirmations", label: "Affirmations" },
  { href: "/quotes", label: "Quotes" },
  { href: "/suggest", label: "Submit a question" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/88 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-7">
        <Link
          href="/"
          className="font-display text-[22px] font-semibold leading-none text-sage-dark"
        >
          normal<span className="text-accent">.</span>
        </Link>

        <nav
          className="hidden items-center gap-7 text-sm text-ink-secondary md:flex"
          aria-label="Primary"
        >
          {DESKTOP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/account/saved"
            className="hidden rounded-full bg-sage-dark px-[18px] py-2 text-[13.5px] font-semibold text-white sm:inline-flex"
          >
            Saved
          </Link>
          <AccountMenu />
          <SiteMobileNav />
        </div>
      </div>
    </header>
  );
}
