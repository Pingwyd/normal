"use client";

import { useState } from "react";

import {
  copyRecoveryCodes,
  downloadRecoveryCodes,
} from "@/lib/account/recovery-codes";

type RecoveryCodesPanelProps = {
  username: string;
  codes: string[];
  onContinue: () => void;
};

export function RecoveryCodesPanel({
  username,
  codes,
  onContinue,
}: RecoveryCodesPanelProps) {
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function handleCopyAll() {
    try {
      await copyRecoveryCodes(codes);
      setCopyMessage("Recovery codes copied to your clipboard.");
    } catch {
      setCopyMessage(
        "Could not copy codes. Try downloading the .txt file instead.",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 rounded-xl border border-border bg-surface p-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-foreground">
          Save your recovery codes
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary">
          These 8 codes are shown once. Download or copy them now. You will need
          one unused code if you forget your password.
        </p>
      </div>

      <ul className="grid gap-2 rounded-lg border border-border-subtle bg-surface-muted p-4 font-mono text-sm text-foreground">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => downloadRecoveryCodes(username, codes)}
          className="rounded-full border border-sage-dark bg-surface px-4 py-2 text-sm font-medium text-sage-dark hover:bg-sage-dark hover:text-white"
        >
          Download .txt
        </button>
        <button
          type="button"
          onClick={() => {
            void handleCopyAll();
          }}
          className="rounded-full border border-sage-dark bg-surface px-4 py-2 text-sm font-medium text-sage-dark hover:bg-sage-dark hover:text-white"
        >
          Copy all
        </button>
      </div>

      {copyMessage ? (
        <p className="text-sm text-ink-secondary" role="status">
          {copyMessage}
        </p>
      ) : null}

      <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-secondary">
        <input
          type="checkbox"
          checked={savedConfirmed}
          onChange={(event) => setSavedConfirmed(event.target.checked)}
          className="mt-1"
        />
        <span>I have saved my recovery codes in a safe place</span>
      </label>

      <button
        type="button"
        disabled={!savedConfirmed}
        onClick={onContinue}
        className="w-full rounded-full bg-sage-dark px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Continue to app
      </button>
    </div>
  );
}
