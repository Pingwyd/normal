import type { ReactNode } from "react";

type DeckStackFrameProps = {
  children: ReactNode;
  hint?: string;
};

export function DeckStackFrame({ children, hint }: DeckStackFrameProps) {
  return (
    <div>
      <div className="relative min-h-[220px]">
        <div
          className="pointer-events-none absolute inset-0 translate-y-5 scale-[0.92] rotate-[-4deg] rounded-[18px] bg-surface/35 shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 translate-y-2.5 scale-[0.96] rotate-[4deg] rounded-[18px] bg-surface/60 shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
          aria-hidden="true"
        />
        <div className="relative z-10">{children}</div>
      </div>
      {hint ? (
        <p className="mt-3 text-center text-[11.5px] text-white/55">{hint}</p>
      ) : null}
    </div>
  );
}
