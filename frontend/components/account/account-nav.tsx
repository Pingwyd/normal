"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { clearAccountSession } from "@/lib/account/session-client";

export function AccountNav() {
  const router = useRouter();
  const { isReady, accountId, username, clearAuthenticatedSession } =
    useFavorites();
  const { clearAuthenticatedSession: clearPreferencesSession } =
    usePreferences();

  async function handleSignOut() {
    await clearAccountSession();
    clearAuthenticatedSession();
    clearPreferencesSession();
    router.push("/");
    router.refresh();
  }

  if (!isReady) {
    return null;
  }

  if (accountId) {
    return (
      <div className="flex items-center gap-3 sm:gap-4">
        {username ? (
          <span className="hidden text-sm text-muted sm:inline">
            {username}
          </span>
        ) : null}
        <Link
          href="/account/saved"
          className="text-sm font-medium text-sage-dark hover:text-sage"
        >
          Saved
        </Link>
        <Link
          href="/account/settings"
          className="text-sm font-medium text-sage-dark hover:text-sage"
        >
          Settings
        </Link>
        <button
          type="button"
          onClick={() => {
            void handleSignOut();
          }}
          className="text-sm font-medium text-sage-dark hover:text-sage"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Link
        href="/account/settings"
        className="text-sm font-medium text-sage-dark hover:text-sage"
      >
        Settings
      </Link>
      <Link
        href="/account/login"
        className="text-sm font-medium text-sage-dark hover:text-sage"
      >
        Sign in
      </Link>
      <Link
        href="/account/signup"
        className="hidden rounded-full border border-sage-dark bg-surface px-3 py-1.5 text-sm font-medium text-sage-dark hover:bg-sage-dark hover:text-white sm:inline-flex"
      >
        Create account
      </Link>
    </div>
  );
}
