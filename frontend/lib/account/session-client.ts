export async function establishAccountSession(
  accessToken: string,
): Promise<void> {
  const response = await fetch("/api/account/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_token: accessToken }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Could not start your session.");
  }
}

export async function clearAccountSession(): Promise<void> {
  await fetch("/api/account/session", { method: "DELETE" });
}
