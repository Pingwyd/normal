import type { ReactNode } from "react";

type DeckPanelSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export function DeckPanelSection({
  eyebrow,
  title,
  description,
  action,
  children,
}: DeckPanelSectionProps) {
  return (
    <section className="mb-16 grid gap-10 rounded-3xl bg-sage-dark px-6 py-14 text-white sm:px-10 lg:grid-cols-[1fr_340px] lg:items-center">
      <div>
        <p className="font-mono text-[11.5px] uppercase tracking-wide text-accent">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-display text-[30px] font-medium leading-tight text-white">
          {title}
        </h2>
        <p className="mt-3.5 max-w-[380px] text-[14.5px] leading-relaxed text-white/75">
          {description}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
