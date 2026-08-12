import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-[#D8D5CC] bg-[#F2F1EC]/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-xl text-[#202B26]">
          Is it normal?
        </Link>
        <p className="hidden text-sm text-[#5A6560] sm:block">
          Honest answers, no forced positivity
        </p>
      </div>
    </header>
  );
}
