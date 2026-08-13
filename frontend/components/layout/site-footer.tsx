import Link from "next/link";

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
        <div className="mb-7 flex flex-col gap-4 rounded-xl border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-[13px] leading-relaxed text-ink-secondary">
            If you are in crisis or thinking about harming yourself, you do
            not need to browse. Talk to someone now.
          </p>
          <a
            href="https://www.samaritans.org/how-we-can-help/contact-samaritan/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-semibold text-sage-dark hover:text-sage"
          >
            Find a crisis line
          </a>
        </div>

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
