import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCOUNT_SESSION_COOKIE } from "@/lib/account/session";

export const runtime = "nodejs";

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(
    /\/$/,
    "",
  );
}

async function getAccountAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value ?? null;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const accessToken = await getAccountAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${getApiBaseUrl()}/v1/push-subscriptions`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = (await response.json()) as {
    data: unknown;
    error: { code: string; message: string } | null;
  };

  if (response.status === 401 && accessToken) {
    const cookieStore = await cookies();
    cookieStore.delete(ACCOUNT_SESSION_COOKIE);
  }

  return NextResponse.json(body, { status: response.status });
}
