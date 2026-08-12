"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Sign-in failed.");
      setIsSubmitting(false);
      return;
    }

    const nextPath = searchParams.get("next") ?? "/admin/cards";
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4">
      <div>
        <label htmlFor="admin-email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="admin-password"
          className="mb-1 block text-sm font-medium"
        >
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
        />
      </div>
      {error ? (
        <p className="rounded-lg border border-[#E8A97A] bg-[#FFF7F0] px-3 py-2 text-sm text-[#202B26]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[#33473D] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
