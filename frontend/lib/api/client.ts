import { ApiRequestError } from "./errors";
import type { ApiEnvelope } from "./types";

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return "http://127.0.0.1:8000";
  }
  return baseUrl.replace(/\/$/, "");
}

export async function apiGet<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; meta: ApiEnvelope<T>["meta"] }> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(
      `The server returned an unexpected status (${response.status}).`,
    );
  }

  let body: ApiEnvelope<T>;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error("The server returned an unexpected response.");
  }

  if (body.error) {
    throw new ApiRequestError(body.error);
  }

  if (body.data == null) {
    throw new Error("The server returned no data.");
  }

  return { data: body.data, meta: body.meta };
}
