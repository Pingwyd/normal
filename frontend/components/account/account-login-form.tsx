"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { establishAccountSession } from "@/lib/account/session-client";
import { loginAccount } from "@/lib/api/accounts";
import { ApiRequestError } from "@/lib/api/errors";

function AccountLoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { readLocalFavoritesForMerge, applyAuthenticatedSession } =
    useFavorites();
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
      className="mx-auto w-full max-w-xl space-y-5 rounded-xl border border-[#D8D5CC] bg-white p-6"
    >
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-[#202B26]">Sign in</h2>
        <p className="text-sm leading-relaxed text-[#5A6560]">
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
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-1 block text-sm font-medium"
        >
          Password *
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
        />
      </div>

      {errorMessage ? (
        <p
          className="rounded-lg border border-[#E8A97A] bg-[#FFF7F0] px-3 py-2 text-sm text-[#202B26]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[#33473D] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <div className="space-y-2 text-center text-sm text-[#5A6560]">
        <p>
          <Link
            href="/account/recover"
            className="text-[#33473D] hover:underline"
          >
            Forgot password? Use a recovery code
          </Link>
        </p>
        <p>
          New here?{" "}
          <Link
            href="/account/signup"
            className="text-[#33473D] hover:underline"
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
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-xl rounded-xl border border-[#D8D5CC] bg-white p-6 text-sm text-[#5A6560]">
          Loading sign-in form...
        </div>
      }
    >
      <AccountLoginFormInner />
    </Suspense>
  );
}
