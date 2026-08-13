type ParagraphBlockProps = {
  data: Record<string, unknown>;
};

export function ParagraphBlock({ data }: ParagraphBlockProps) {
  const text = typeof data.text === "string" ? data.text : "";
  if (!text) {
    return null;
  }

  return (
    <p className="text-base leading-relaxed text-ink-secondary whitespace-pre-wrap">
      {text}
    </p>
  );
}
