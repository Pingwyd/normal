import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiRequestError } from "@/lib/api/errors";
import type { PaginationMeta } from "@/lib/api/types";
import { ADMIN_SESSION_COOKIE, type AdminSession } from "@/lib/admin/session";

function getApiBaseUrl(): string {
  const configured =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:8000";
  return configured.replace(/\/$/, "");
}

function apiUnreachableMessage(cause: string): string {
  return `Could not reach the API at ${getApiBaseUrl()}. Make sure the backend is running locally (port 8000) and that API_URL or NEXT_PUBLIC_API_URL points to it. (${cause})`;
}

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/v1/admin/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const body = (await response.json()) as {
      data: {
        role: "founder" | "clinical_reviewer";
        display_name: string;
      } | null;
      error: { code: string; message: string } | null;
    };

    if (!response.ok || body.error || !body.data) {
      return null;
    }

    return {
      accessToken,
      role: body.data.role,
      displayName: body.data.display_name,
    };
  } catch {
    return null;
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireFounderSession(): Promise<AdminSession> {
  const session = await requireAdminSession();
  if (session.role !== "founder") {
    redirect("/admin/cards");
  }
  return session;
}

export async function adminApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const session = await requireAdminSession();

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    const cause = error instanceof Error ? error.message : "network error";
    throw new ApiRequestError({
      code: "INTERNAL_ERROR",
      message: apiUnreachableMessage(cause),
    });
  }

  let body: {
    data: T | null;
    error: { code: string; message: string } | null;
    detail?: unknown;
  };

  try {
    body = (await response.json()) as typeof body;
  } catch {
    throw new ApiRequestError({
      code: "INTERNAL_ERROR",
      message: `The API returned a non-JSON response (status ${response.status}).`,
    });
  }

  if (body.error) {
    throw new ApiRequestError(body.error);
  }

  if (!response.ok) {
    if (Array.isArray(body.detail)) {
      const message = body.detail
        .map((item) => {
          if (!item || typeof item !== "object" || !("msg" in item)) {
            return "Invalid request.";
          }
          const record = item as { loc?: unknown[]; msg?: string };
          const path = Array.isArray(record.loc)
            ? record.loc.filter((part) => part !== "body").join(".")
            : "";
          const msg = record.msg ?? "Invalid value";
          return path ? `${path}: ${msg}` : msg;
        })
        .join("; ");
      throw new ApiRequestError({ code: "VALIDATION_ERROR", message });
    }

    throw new ApiRequestError({
      code: "INTERNAL_ERROR",
      message: `Request failed with status ${response.status}.`,
    });
  }

  if (body.data == null) {
    throw new ApiRequestError({
      code: "INTERNAL_ERROR",
      message: "The server returned no data.",
    });
  }

  return body.data;
}

export async function adminApiListRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; meta: PaginationMeta | null }> {
  const session = await requireAdminSession();

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    const cause = error instanceof Error ? error.message : "network error";
    throw new ApiRequestError({
      code: "INTERNAL_ERROR",
      message: apiUnreachableMessage(cause),
    });
  }

  let body: {
    data: T | null;
    meta: PaginationMeta | null;
    error: { code: string; message: string } | null;
  };

  try {
    body = (await response.json()) as typeof body;
  } catch {
    throw new ApiRequestError({
      code: "INTERNAL_ERROR",
      message: `The API returned a non-JSON response (status ${response.status}).`,
    });
  }

  if (body.error) {
    throw new ApiRequestError(body.error);
  }

  if (body.data == null) {
    throw new ApiRequestError({
      code: "INTERNAL_ERROR",
      message: "The server returned no data.",
    });
  }

  return { data: body.data, meta: body.meta };
}
