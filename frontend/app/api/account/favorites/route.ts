import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { proxyAccountApi } from "@/lib/account/server-api";
import { ACCOUNT_SESSION_COOKIE } from "@/lib/account/session";

export const runtime = "nodejs";

async function getAccountAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value ?? null;
}

export async function GET() {
  const accessToken = await getAccountAccessToken();
  if (!accessToken) {
    return NextResponse.json({ data: [] });
  }

  const response = await proxyAccountApi("/v1/favorites", accessToken, {
    method: "GET",
  });

  const body = (await response.json()) as {
    data: unknown;
    error: { code: string; message: string } | null;
  };

  if (response.status === 401) {
    const cookieStore = await cookies();
    cookieStore.delete(ACCOUNT_SESSION_COOKIE);
    return NextResponse.json({ data: [] }, { status: 401 });
  }

  if (!response.ok || body.error) {
    return NextResponse.json(
      { error: body.error?.message ?? "Could not load saved items." },
      { status: response.status || 502 },
    );
  }

  return NextResponse.json({ data: body.data ?? [] });
}

export async function POST(request: Request) {
  const accessToken = await getAccountAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message:
            "Sign in to sync favorites across devices, or save them locally.",
        },
      },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const response = await proxyAccountApi("/v1/favorites", accessToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as {
    data: unknown;
    error: { code: string; message: string } | null;
  };

  return NextResponse.json(body, { status: response.status });
}
