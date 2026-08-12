import Link from "next/link";
import { AlertCircle, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[#D8D5CC] bg-[#F2F1EC]">
      <section
        aria-labelledby="crisis-resources-heading"
        className="border-b border-[#D8D5CC] bg-[#FFF7F0] px-4 py-5 sm:px-6"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-[#33473D]"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <h2
                id="crisis-resources-heading"
                className="font-display text-base text-[#202B26]"
              >
                Need urgent support?
              </h2>
              <p className="text-sm leading-relaxed text-[#3A4540]">
                If you are in crisis or worried about your safety, contact
                emergency services or a helpline now. This site is not a
                substitute for professional care.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-[#33473D] sm:items-end">
            <p className="inline-flex items-center gap-2 font-medium">
              <Phone size={16} aria-hidden="true" />
              Samaritans: 116 123 (free, 24/7)
            </p>
            <p className="text-[#5A6560]">
              NHS urgent mental health advice: call 111
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="font-display text-lg text-[#202B26]">Is it normal?</p>
            <p className="max-w-md text-sm leading-relaxed text-[#5A6560]">
              Honest, sourced answers about everyday worries. Clinical review
              supports sensitive topics where noted.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-col gap-2 text-sm text-[#33473D]"
          >
            <Link href="/suggest" className="hover:text-[#4B6B5E]">
              Suggest a question
            </Link>
            <span className="text-[#5A6560]">About (coming soon)</span>
            <span className="text-[#5A6560]">Privacy (coming soon)</span>
            <span className="text-[#5A6560]">Disclaimer (coming soon)</span>
          </nav>
        </div>

        <p className="mt-8 border-t border-[#ECEAE4] pt-6 text-xs text-[#5A6560]">
          Content is reviewed for accuracy and clarity. It is general
          information, not personal medical advice.
        </p>
      </div>
    </footer>
  );
}
