"use client";

import Link from "next/link";
import { useState } from "react";

import { usePreferences } from "@/components/preferences/preferences-provider";
import {
  readPushPromptDismissed,
  writePushPromptDismissed,
} from "@/lib/preferences/local-storage";

export function PushOptInPrompt() {
  const {
    pushSupported,
    pushEnabled,
    pushPermission,
    isSaving,
    enablePushNotifications,
  } = usePreferences();
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return readPushPromptDismissed();
  });

  if (
    !pushSupported ||
    pushEnabled ||
    pushPermission === "denied" ||
    isDismissed
  ) {
    return null;
  }

  return (
    <section className="rounded-xl border border-border bg-surface px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-foreground">
            Daily affirmations and quotes
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Optional browser notifications. You can turn them off anytime in
            settings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              void enablePushNotifications();
            }}
            className="rounded-full border border-sage-dark bg-sage-dark px-4 py-2 text-sm font-medium text-white hover:bg-sage disabled:cursor-not-allowed disabled:opacity-60"
          >
            Enable notifications
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              writePushPromptDismissed(true);
              setIsDismissed(true);
            }}
            className="rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-sage-dark hover:border-sage-dark"
          >
            Not now
          </button>
          <Link
            href="/account/settings"
            className="text-sm font-medium text-sage-dark hover:text-sage"
          >
            Settings
          </Link>
        </div>
      </div>
    </section>
  );
}
