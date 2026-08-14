type CrisisResourceStripProps = {
  className?: string;
};

export function CrisisResourceStrip({ className = "" }: CrisisResourceStripProps) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
      role="note"
      aria-label="Crisis resources"
    >
      <p className="max-w-xl text-[13px] leading-relaxed text-ink-secondary">
        If you are in crisis or thinking about harming yourself, you do not need
        to browse. Talk to someone now.
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
  );
}
