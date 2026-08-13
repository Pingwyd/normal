"use client";

import { ArrowLeft, ArrowRight, Share2 } from "lucide-react";

type DeckActionBarProps = {
  onSkip: () => void;
  onSave: () => void;
  onShare: () => void;
  isSavePending?: boolean;
  isSaved?: boolean;
  shareLabel?: string;
};

export function DeckActionBar({
  onSkip,
  onSave,
  onShare,
  isSavePending = false,
  isSaved = false,
  shareLabel = "Share",
}: DeckActionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
      <button
        type="button"
        onClick={onSkip}
        className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Skip
      </button>
      <button
        type="button"
        onClick={onShare}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-accent/90"
      >
        <Share2 size={16} aria-hidden="true" />
        {shareLabel}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isSavePending}
        aria-pressed={isSaved}
        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-sage-dark shadow-sm hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ArrowRight size={16} aria-hidden="true" />
        {isSaved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
