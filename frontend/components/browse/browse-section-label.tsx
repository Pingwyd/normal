type BrowseSectionLabelProps = {
  title: string;
  meta: string;
};

export function BrowseSectionLabel({ title, meta }: BrowseSectionLabelProps) {
  return (
    <div className="mb-[22px] flex items-baseline justify-between gap-4">
      <h2 className="font-display text-2xl font-medium text-foreground">
        {title}
      </h2>
      <p className="font-mono text-[11.5px] uppercase tracking-wide text-ink-secondary">
        {meta}
      </p>
    </div>
  );
}
