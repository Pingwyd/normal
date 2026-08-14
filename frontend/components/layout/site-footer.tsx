import Link from "next/link";

import { CrisisResourceStrip } from "@/components/layout/crisis-resource-strip";

const FOOTER_LINKS = [
  { href: "#", label: "About", disabled: true },
  { href: "#", label: "How we source content", disabled: true },
  { href: "#", label: "Meet our clinical reviewer", disabled: true },
  { href: "#", label: "Privacy", disabled: true },
  { href: "#", label: "Disclaimer", disabled: true },
  { href: "/suggest", label: "Submit a question", disabled: false },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border px-4 py-10 text-[12.5px] text-ink-secondary sm:px-6">
      <div className="mx-auto w-full max-w-[1100px]">
        <CrisisResourceStrip className="mb-7" />

        <nav
          aria-label="Footer"
          className="mb-3.5 flex flex-wrap gap-5 text-ink-secondary"
        >
          {FOOTER_LINKS.map((link) =>
            link.disabled ? (
              <span key={link.label} className="text-muted">
                {link.label} (coming soon)
              </span>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-foreground"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <p className="leading-relaxed">
          This site shares general information and is not a substitute for
          professional medical or mental health advice.
        </p>
      </div>
    </footer>
  );
}
