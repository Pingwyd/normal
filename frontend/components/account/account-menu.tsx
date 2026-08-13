"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, User } from "lucide-react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { clearAccountSession } from "@/lib/account/session-client";

export function AccountMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isReady, accountId, username, clearAuthenticatedSession } =
    useFavorites();
  const { clearAuthenticatedSession: clearPreferencesSession } =
    usePreferences();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    await clearAccountSession();
    clearAuthenticatedSession();
    clearPreferencesSession();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  }

  if (!isReady) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-sage-dark hover:border-sage"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={username ? `Account menu for ${username}` : "Account menu"}
      >
        <User size={18} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-44 rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {username ? (
            <p className="border-b border-border-subtle px-4 py-2 text-xs text-muted">
              {username}
            </p>
          ) : null}
          <Link
            href="/account/settings"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
            onClick={() => setIsOpen(false)}
          >
            <Settings size={16} aria-hidden="true" />
            Settings
          </Link>
          {accountId ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
              onClick={() => {
                void handleSignOut();
              }}
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          ) : (
            <>
              <Link
                href="/account/login"
                role="menuitem"
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
                onClick={() => setIsOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/account/signup"
                role="menuitem"
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
                onClick={() => setIsOpen(false)}
              >
                Create account
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
