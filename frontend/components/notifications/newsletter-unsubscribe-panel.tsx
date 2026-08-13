"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { NewsletterUnsubscribeSkeleton } from "@/components/notifications/newsletter-unsubscribe-skeleton";
import { unsubscribeNewsletterByToken } from "@/lib/notifications/client-api";
import {
  readLocalPreferences,
  writeLocalPreferences,
} from "@/lib/preferences/local-storage";

function NewsletterUnsubscribeInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">(() =>
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState(() =>
    token
      ? "Processing your unsubscribe request."
      : "This unsubscribe link is missing a token.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function unsubscribe() {
      try {
        const result = await unsubscribeNewsletterByToken(token);
        if (cancelled) {
          return;
        }

        const local = readLocalPreferences();
        writeLocalPreferences({
          ...local,
          newsletter_email: result.email,
          newsletter_enabled: result.enabled,
        });

        setStatus("success");
        setMessage(
          "You have been unsubscribed from the affirmations newsletter.",
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not complete the unsubscribe request.",
        );
      }
    }

    void unsubscribe();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 rounded-xl border border-border bg-surface p-6 text-center">
      <h1 className="font-display text-2xl text-foreground">Newsletter</h1>
      <p className="text-sm leading-relaxed text-muted">{message}</p>
      {status === "success" ? (
        <Link
          href="/account/settings"
          className="inline-flex rounded-full border border-sage-dark bg-sage-dark px-4 py-2 text-sm font-medium text-white hover:bg-sage"
        >
          Open settings
        </Link>
      ) : null}
    </div>
  );
}

export function NewsletterUnsubscribePanel() {
  return (
    <Suspense fallback={<NewsletterUnsubscribeSkeleton />}>
      <NewsletterUnsubscribeInner />
    </Suspense>
  );
}
