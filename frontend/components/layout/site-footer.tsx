import Link from "next/link";
import { AlertCircle, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-background">
      <section
        aria-labelledby="crisis-resources-heading"
        className="border-b border-border bg-accent-soft px-4 py-5 sm:px-6"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-sage-dark"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <h2
                id="crisis-resources-heading"
                className="font-display text-base text-foreground"
              >
                Need urgent support?
              </h2>
              <p className="text-sm leading-relaxed text-ink-secondary">
                If you are in crisis or worried about your safety, contact
                emergency services or a helpline now. This site is not a
                substitute for professional care.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-sage-dark sm:items-end">
            <p className="inline-flex items-center gap-2 font-medium">
              <Phone size={16} aria-hidden="true" />
              Samaritans: 116 123 (free, 24/7)
            </p>
            <p className="text-muted">
              NHS urgent mental health advice: call 111
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="font-display text-lg text-foreground">Is it normal?</p>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Honest, sourced answers about everyday worries. Clinical review
              supports sensitive topics where noted.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-col gap-2 text-sm text-sage-dark"
          >
            <Link href="/suggest" className="hover:text-sage">
              Suggest a question
            </Link>
            <span className="text-muted">About (coming soon)</span>
            <span className="text-muted">Privacy (coming soon)</span>
            <span className="text-muted">Disclaimer (coming soon)</span>
          </nav>
        </div>

        <p className="mt-8 border-t border-border-subtle pt-6 text-xs text-muted">
          Content is reviewed for accuracy and clarity. It is general
          information, not personal medical advice.
        </p>
      </div>
    </footer>
  );
}
