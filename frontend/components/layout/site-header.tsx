import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-[#D8D5CC] bg-[#F2F1EC]/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-xl text-[#202B26]">
          Is it normal?
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <p className="hidden text-sm text-[#5A6560] md:block">
            Honest answers, no forced positivity
          </p>
          <Link
            href="/suggest"
            className="rounded-full border border-[#33473D] bg-white px-4 py-2 text-sm font-medium text-[#33473D] hover:bg-[#33473D] hover:text-white"
          >
            Suggest a question
          </Link>
        </div>
      </div>
    </header>
  );
}
