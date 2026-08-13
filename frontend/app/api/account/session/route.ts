import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { proxyAccountApi } from "@/lib/account/server-api";
import { ACCOUNT_SESSION_COOKIE } from "@/lib/account/session";
import { parseAccountIdFromAccessToken } from "@/lib/account/token";

export const runtime = "nodejs";

async function getAccountAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value ?? null;
}

export async function GET() {
  const accessToken = await getAccountAccessToken();
  if (!accessToken) {
    return NextResponse.json({ account: null });
  }

  const accountId = parseAccountIdFromAccessToken(accessToken);
  if (!accountId) {
    const cookieStore = await cookies();
    cookieStore.delete(ACCOUNT_SESSION_COOKIE);
    return NextResponse.json({ account: null });
  }

  const validationResponse = await proxyAccountApi(
    "/v1/favorites",
    accessToken,
    { method: "GET" },
  );

  if (validationResponse.status === 401) {
    const cookieStore = await cookies();
    cookieStore.delete(ACCOUNT_SESSION_COOKIE);
    return NextResponse.json({ account: null });
  }

  if (!validationResponse.ok) {
    return NextResponse.json(
      { error: "Could not validate account session." },
      { status: 502 },
    );
  }

  return NextResponse.json({ account: { id: accountId } });
}

export async function POST(request: Request) {
  let accessToken = "";
  let maxAge = 60 * 60 * 24 * 30;

  try {
    const body = (await request.json()) as {
      access_token?: string;
      max_age?: number;
    };
    accessToken = body.access_token?.trim() ?? "";
    if (typeof body.max_age === "number" && body.max_age > 0) {
      maxAge = body.max_age;
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "Access token is required." },
      { status: 400 },
    );
  }

  const accountId = parseAccountIdFromAccessToken(accessToken);
  if (!accountId) {
    return NextResponse.json(
      { error: "Invalid access token." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ACCOUNT_SESSION_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  return NextResponse.json({ ok: true, account: { id: accountId } });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCOUNT_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
