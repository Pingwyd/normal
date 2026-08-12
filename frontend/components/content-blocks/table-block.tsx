type TableBlockProps = {
  data: Record<string, unknown>;
};

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function readRows(value: unknown): string[][] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((row) => {
    if (!Array.isArray(row)) {
      return [];
    }
    return [row.filter((cell): cell is string => typeof cell === "string")];
  });
}

export function TableBlock({ data }: TableBlockProps) {
  const headers = readStringArray(data.headers);
  const rows = readRows(data.rows);
  if (headers.length === 0 && rows.length === 0) {
    return null;
  }

  const caption = typeof data.caption === "string" ? data.caption : undefined;

  return (
    <figure className="overflow-x-auto rounded-xl border border-[#D8D5CC] bg-white">
      {caption ? (
        <figcaption className="border-b border-[#ECEAE4] px-4 py-3 font-display text-lg text-[#202B26]">
          {caption}
        </figcaption>
      ) : null}
      <table className="min-w-full text-left text-sm">
        {headers.length > 0 ? (
          <thead className="bg-[#F7F6F2]">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-4 py-3 font-medium text-[#33473D]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-[#ECEAE4]">
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className="px-4 py-3 text-[#3A4540]"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
