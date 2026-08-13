type ChartPoint = {
  label: string;
  value: number;
};

type ChartBlockProps = {
  data: Record<string, unknown>;
};

function readPoints(data: Record<string, unknown>): ChartPoint[] {
  if (!Array.isArray(data.points)) {
    return [];
  }

  return data.points.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const record = item as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label : "";
    const value = typeof record.value === "number" ? record.value : NaN;
    if (!label || !Number.isFinite(value)) {
      return [];
    }
    return [{ label, value }];
  });
}

export function ChartBlock({ data }: ChartBlockProps) {
  const points = readPoints(data);
  if (points.length === 0) {
    return null;
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const title = typeof data.title === "string" ? data.title : undefined;
  const xLabel = typeof data.x_label === "string" ? data.x_label : undefined;
  const yLabel = typeof data.y_label === "string" ? data.y_label : undefined;

  return (
    <figure className="rounded-xl border border-border bg-surface p-5">
      {title ? (
        <figcaption className="mb-4 font-display text-lg text-foreground">
          {title}
        </figcaption>
      ) : null}
      <div
        className="flex items-end gap-3"
        role="img"
        aria-label={title ?? "Bar chart"}
      >
        {points.map((point) => (
          <div
            key={point.label}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <div
              className="w-full rounded-t-md bg-sage"
              style={{
                height: `${Math.max(12, (point.value / maxValue) * 160)}px`,
              }}
              title={`${point.label}: ${point.value}`}
            />
            <span className="text-center text-xs text-muted">
              {point.label}
            </span>
          </div>
        ))}
      </div>
      {(xLabel || yLabel) && (
        <div className="mt-4 flex justify-between text-xs text-muted">
          <span>{yLabel}</span>
          <span>{xLabel}</span>
        </div>
      )}
    </figure>
  );
}
