"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { establishAccountSession } from "@/lib/account/session-client";
import { recoverAccount } from "@/lib/api/accounts";
import { ApiRequestError } from "@/lib/api/errors";

export function AccountRecoverForm() {
  const router = useRouter();
  const { applyAuthenticatedSession } = useFavorites();
  const [username, setUsername] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await recoverAccount(
        username.trim(),
        recoveryCode.trim(),
        newPassword,
      );
      await establishAccountSession(data.access_token);
      applyAuthenticatedSession(data.account, data.favorites);
      router.replace("/account/saved");
      router.refresh();
    } catch (error) {
      let message = "Could not recover your account.";
      if (error instanceof ApiRequestError) {
        if (error.code === "RECOVERY_EXHAUSTED") {
          message =
            "No unused recovery codes remain for this account. The account cannot be recovered.";
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
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
        <h2 className="font-display text-2xl text-[#202B26]">
          Recover with a code
        </h2>
        <p className="text-sm leading-relaxed text-[#5A6560]">
          Enter one unused recovery code from signup. That code will be burned
          after a successful reset.
        </p>
      </div>

      <div>
        <label
          htmlFor="recover-username"
          className="mb-1 block text-sm font-medium"
        >
          Username *
        </label>
        <input
          id="recover-username"
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
          htmlFor="recover-code"
          className="mb-1 block text-sm font-medium"
        >
          Recovery code *
        </label>
        <input
          id="recover-code"
          type="text"
          autoComplete="one-time-code"
          required
          value={recoveryCode}
          onChange={(event) => setRecoveryCode(event.target.value)}
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 font-mono text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="recover-password"
          className="mb-1 block text-sm font-medium"
        >
          New password *
        </label>
        <input
          id="recover-password"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="recover-confirm-password"
          className="mb-1 block text-sm font-medium"
        >
          Confirm new password *
        </label>
        <input
          id="recover-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
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
        {isSubmitting ? "Resetting password..." : "Reset password"}
      </button>

      <p className="text-center text-sm text-[#5A6560]">
        Remember your password?{" "}
        <Link href="/account/login" className="text-[#33473D] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
