"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AccountFormPageSkeleton } from "@/components/account/account-form-page-skeleton";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { PasswordInput } from "@/components/ui/password-input";
import { establishAccountSession } from "@/lib/account/session-client";
import { loginAccount } from "@/lib/api/accounts";
import { ApiRequestError } from "@/lib/api/errors";

function AccountLoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { readLocalFavoritesForMerge, applyAuthenticatedSession } =
    useFavorites();
  const { applyAuthenticatedSession: applyPreferencesSession } =
    usePreferences();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { data } = await loginAccount(
        username.trim(),
        password,
        readLocalFavoritesForMerge(),
      );
      await establishAccountSession(data.access_token);
      applyAuthenticatedSession(data.account, data.favorites);
      await applyPreferencesSession(data.account);

      const nextPath = searchParams.get("next") ?? "/account/saved";
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Sign-in failed.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-xl space-y-5 rounded-xl border border-border bg-surface p-6"
    >
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-foreground">Sign in</h2>
        <p className="text-sm leading-relaxed text-muted">
          Sign in to sync saved cards across devices. Any saves on this device
          will merge into your account.
        </p>
      </div>

      <div>
        <label
          htmlFor="login-username"
          className="mb-1 block text-sm font-medium"
        >
          Username *
        </label>
        <input
          id="login-username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-1 block text-sm font-medium"
        >
          Password *
        </label>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {errorMessage ? (
        <p
          className="rounded-lg border border-warning-border bg-warning-surface px-3 py-2 text-sm text-foreground"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-sage-dark px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <div className="space-y-2 text-center text-sm text-muted">
        <p>
          <Link
            href="/account/recover"
            className="text-sage-dark hover:underline"
          >
            Forgot password? Use a recovery code
          </Link>
        </p>
        <p>
          New here?{" "}
          <Link
            href="/account/signup"
            className="text-sage-dark hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </form>
  );
}

export function AccountLoginForm() {
  return (
    <Suspense fallback={<AccountFormPageSkeleton fieldCount={2} />}>
      <AccountLoginFormInner />
    </Suspense>
  );
}
