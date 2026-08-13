import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";

export default function CardNotFound() {
  return (
    <div className="min-h-full bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-3xl text-foreground">
          Card not found
        </h1>
        <p className="mt-3 text-sm text-muted">
          That card may have been removed or the link is incorrect.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-sage-dark px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to browse
        </Link>
      </main>
    </div>
  );
}
