import { ApiRequestError } from "./errors";
import type { ApiEnvelope, ApiErrorBody } from "./types";

export type ApiPostResult<T> = {
  data: T;
  meta: ApiEnvelope<T>["meta"];
  info: ApiErrorBody | null;
};

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

export async function apiPost<T>(
  path: string,
  payload: unknown,
  options?: { infoCodes?: string[] },
): Promise<ApiPostResult<T>> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let body: ApiEnvelope<T>;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error("The server returned an unexpected response.");
  }

  const infoCodes = options?.infoCodes ?? [];
  if (
    response.ok &&
    body.error &&
    infoCodes.includes(body.error.code) &&
    body.data != null
  ) {
    return { data: body.data, meta: body.meta, info: body.error };
  }

  if (body.error) {
    throw new ApiRequestError(body.error);
  }

  if (!response.ok || body.data == null) {
    throw new Error(
      `The server returned an unexpected status (${response.status}).`,
    );
  }

  return { data: body.data, meta: body.meta, info: null };
}
