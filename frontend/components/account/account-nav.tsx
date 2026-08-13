"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { clearAccountSession } from "@/lib/account/session-client";

export function AccountNav() {
  const router = useRouter();
  const { isReady, accountId, username, clearAuthenticatedSession } =
    useFavorites();

  async function handleSignOut() {
    await clearAccountSession();
    clearAuthenticatedSession();
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
          <span className="hidden text-sm text-[#5A6560] sm:inline">
            {username}
          </span>
        ) : null}
        <Link
          href="/account/saved"
          className="text-sm font-medium text-[#33473D] hover:text-[#4B6B5E]"
        >
          Saved
        </Link>
        <button
          type="button"
          onClick={() => {
            void handleSignOut();
          }}
          className="text-sm font-medium text-[#33473D] hover:text-[#4B6B5E]"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Link
        href="/account/login"
        className="text-sm font-medium text-[#33473D] hover:text-[#4B6B5E]"
      >
        Sign in
      </Link>
      <Link
        href="/account/signup"
        className="hidden rounded-full border border-[#33473D] bg-white px-3 py-1.5 text-sm font-medium text-[#33473D] hover:bg-[#33473D] hover:text-white sm:inline-flex"
      >
        Create account
      </Link>
    </div>
  );
}
