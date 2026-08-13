import Link from "next/link";

import { AccountNav } from "@/components/account/account-nav";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-xl text-foreground">
          Is it normal?
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <nav
            className="hidden items-center gap-4 text-sm font-medium text-sage-dark md:flex"
            aria-label="Primary"
          >
            <Link href="/affirmations" className="hover:text-sage">
              Affirmations
            </Link>
            <Link href="/quotes" className="hover:text-sage">
              Quotes
            </Link>
          </nav>
          <p className="hidden text-sm text-muted lg:block">
            Honest answers, no forced positivity
          </p>
          <AccountNav />
          <Link
            href="/suggest"
            className="rounded-full border border-sage-dark bg-surface px-4 py-2 text-sm font-medium text-sage-dark hover:bg-sage-dark hover:text-white"
          >
            Suggest a question
          </Link>
        </div>
      </div>
    </header>
  );
}
