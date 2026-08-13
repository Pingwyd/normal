import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { proxyAccountApi } from "@/lib/account/server-api";
import { ACCOUNT_SESSION_COOKIE } from "@/lib/account/session";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ cardId: string }>;
};

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

function buildProxyHeaders(
  request: Request,
  accessToken: string | null,
): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const deviceId = request.headers.get("X-Device-Id");
  if (deviceId) {
    headers["X-Device-Id"] = deviceId;
  }

  return headers;
}

async function proxyLikeRequest(
  cardId: string,
  request: Request,
  method: "GET" | "POST",
): Promise<NextResponse> {
  const accessToken = await getAccountAccessToken();
  const headers = buildProxyHeaders(request, accessToken);

  if (!accessToken && !request.headers.get("X-Device-Id")) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "X-Device-Id header is required for anonymous likes.",
        },
      },
      { status: 422 },
    );
  }

  const response = accessToken
    ? await proxyAccountApi(`/v1/cards/${cardId}/like`, accessToken, {
        method,
        headers,
      })
    : await fetch(`${getApiBaseUrl()}/v1/cards/${cardId}/like`, {
        method,
        headers,
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

export async function GET(request: Request, context: RouteContext) {
  const { cardId } = await context.params;
  return proxyLikeRequest(cardId, request, "GET");
}

export async function POST(request: Request, context: RouteContext) {
  const { cardId } = await context.params;
  return proxyLikeRequest(cardId, request, "POST");
}
