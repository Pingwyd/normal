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
    <blockquote className="rounded-xl border-l-4 border-[#7086C9] bg-[#F7F6F2] px-5 py-4">
      <p className="font-display text-lg leading-relaxed text-[#202B26]">
        {text}
      </p>
      {attribution ? (
        <footer className="mt-3 text-sm text-[#5A6560]">- {attribution}</footer>
      ) : null}
    </blockquote>
  );
}
