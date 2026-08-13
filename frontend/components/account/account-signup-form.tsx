"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RecoveryCodesPanel } from "@/components/account/recovery-codes-panel";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { PasswordInput } from "@/components/ui/password-input";
import { establishAccountSession } from "@/lib/account/session-client";
import { signupAccount } from "@/lib/api/accounts";
import { ApiRequestError } from "@/lib/api/errors";

const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

type SignupStep =
  | { kind: "form" }
  | {
      kind: "recovery-codes";
      username: string;
      codes: string[];
    };

export function AccountSignupForm() {
  const router = useRouter();
  const { readLocalFavoritesForMerge, applyAuthenticatedSession } =
    useFavorites();
  const { applyAuthenticatedSession: applyPreferencesSession } =
    usePreferences();
  const [step, setStep] = useState<SignupStep>({ kind: "form" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedWarning, setAcceptedWarning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 32) {
      setErrorMessage("Username must be between 3 and 32 characters.");
      return;
    }
    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      setErrorMessage(
        "Username may only contain letters, numbers, and underscores.",
      );
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!acceptedWarning) {
      setErrorMessage(
        "Please confirm that you understand the account recovery limits.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await signupAccount(
        trimmedUsername,
        password,
        readLocalFavoritesForMerge(),
      );
      await establishAccountSession(data.access_token);
      applyAuthenticatedSession(data.account, data.favorites);
      await applyPreferencesSession(data.account);
      setStep({
        kind: "recovery-codes",
        username: data.account.username,
        codes: data.recovery_codes,
      });
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Could not create your account.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step.kind === "recovery-codes") {
    return (
      <RecoveryCodesPanel
        username={step.username}
        codes={step.codes}
        onContinue={() => {
          router.push("/account/saved");
          router.refresh();
        }}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-xl space-y-5 rounded-xl border border-border bg-surface p-6"
    >
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-foreground">Create account</h2>
        <p className="text-sm leading-relaxed text-muted">
          Optional account for syncing saved cards across devices. No email or
          real name required.
        </p>
      </div>

      <div
        className="rounded-lg border border-info-border bg-info-surface px-4 py-3 text-sm leading-relaxed text-foreground"
        role="note"
      >
        <p className="font-medium">Important</p>
        <p className="mt-1 text-ink-secondary">
          We do not store your email or real name. If you lose your password and
          all 8 recovery codes, your account cannot be recovered. This is
          intentional so we can keep your account private.
        </p>
      </div>

      <div>
        <label
          htmlFor="account-username"
          className="mb-1 block text-sm font-medium"
        >
          Username *
        </label>
        <input
          id="account-username"
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
          htmlFor="account-password"
          className="mb-1 block text-sm font-medium"
        >
          Password *
        </label>
        <PasswordInput
          id="account-password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="account-confirm-password"
          className="mb-1 block text-sm font-medium"
        >
          Confirm password *
        </label>
        <PasswordInput
          id="account-confirm-password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-secondary">
        <input
          type="checkbox"
          checked={acceptedWarning}
          onChange={(event) => setAcceptedWarning(event.target.checked)}
          className="mt-1"
        />
        <span>
          I understand my account cannot be recovered without my password or a
          recovery code *
        </span>
      </label>

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
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/account/login" className="text-sage-dark hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
