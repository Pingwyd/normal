import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";

export default function CardNotFound() {
  return (
    <div className="min-h-full bg-[#F2F1EC]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-3xl text-[#202B26]">Card not found</h1>
        <p className="mt-3 text-sm text-[#5A6560]">
          That card may have been removed or the link is incorrect.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-[#33473D] px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to browse
        </Link>
      </main>
    </div>
  );
}
