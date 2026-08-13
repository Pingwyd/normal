import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(
    /\/$/,
    "",
  );
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "Unsubscribe token is required." },
      { status: 400 },
    );
  }

  const response = await fetch(
    `${getApiBaseUrl()}/v1/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const body = (await response.json()) as {
    data: unknown;
    error: { code: string; message: string } | null;
  };

  return NextResponse.json(body, { status: response.status });
}
