type PieSegment = {
  label: string;
  value: number;
};

type PieChartBlockProps = {
  data: Record<string, unknown>;
};

function readSegments(data: Record<string, unknown>): PieSegment[] {
  if (!Array.isArray(data.segments)) {
    return [];
  }

  return data.segments.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const record = item as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label : "";
    const value = typeof record.value === "number" ? record.value : NaN;
    if (!label || !Number.isFinite(value) || value <= 0) {
      return [];
    }
    return [{ label, value }];
  });
}

const PIE_COLORS = ["#4B6B5E", "#7086C9", "#E8A97A", "#33473D", "#A8B5A0"];

export function PieChartBlock({ data }: PieChartBlockProps) {
  const segments = readSegments(data);
  if (segments.length === 0) {
    return null;
  }

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const gradientStops = segments.reduce<string[]>((stops, segment, index) => {
    const totalSoFar = stops.reduce((sum, _, stopIndex) => {
      return sum + segments[stopIndex].value;
    }, 0);
    const start = (totalSoFar / total) * 100;
    const end = ((totalSoFar + segment.value) / total) * 100;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    return [...stops, `${color} ${start}% ${end}%`];
  }, []);

  const title = typeof data.title === "string" ? data.title : undefined;

  return (
    <figure className="rounded-xl border border-[#D8D5CC] bg-white p-5">
      {title ? (
        <figcaption className="mb-4 font-display text-lg text-[#202B26]">
          {title}
        </figcaption>
      ) : null}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div
          className="h-40 w-40 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${gradientStops.join(", ")})` }}
          role="img"
          aria-label={title ?? "Pie chart"}
        />
        <ul className="space-y-2 text-sm text-[#3A4540]">
          {segments.map((segment, index) => (
            <li key={segment.label} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                }}
                aria-hidden="true"
              />
              <span>
                {segment.label}: {Math.round((segment.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
