import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(
    /\/$/,
    "",
  );
}

export async function GET(request: Request): Promise<NextResponse> {
  const incoming = new URL(request.url);
  const target = new URL(`${getApiBaseUrl()}/v1/quotes`);
  target.search = incoming.search;

  const response = await fetch(target, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
