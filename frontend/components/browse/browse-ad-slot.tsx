export function BrowseAdSlot() {
  return (
    <div
      className="col-span-1 flex items-center justify-between rounded-2xl border border-dashed border-border px-[22px] py-4 text-[12.5px] text-ink-secondary lg:col-span-3"
      aria-label="Sponsored placement"
    >
      <span>Ad placement. Browse pages only, never detail pages.</span>
      <span className="rounded-full bg-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide">
        Sponsored
      </span>
    </div>
  );
}
