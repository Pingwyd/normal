type QuoteCalloutBlockProps = {
  data: Record<string, unknown>;
};

export function QuoteCalloutBlock({ data }: QuoteCalloutBlockProps) {
  const text = typeof data.text === "string" ? data.text : "";
  if (!text) {
    return null;
  }

  const attribution =
    typeof data.attribution === "string" ? data.attribution : undefined;

  return (
    <blockquote className="rounded-xl border-l-4 border-info-border bg-surface-muted px-5 py-4">
      <p className="font-display text-lg leading-relaxed text-foreground">
        {text}
      </p>
      {attribution ? (
        <footer className="mt-3 text-sm text-muted">- {attribution}</footer>
      ) : null}
    </blockquote>
  );
}
