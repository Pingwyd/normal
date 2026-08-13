import type { CardLikeResponse } from "@/lib/api/likes-types";
import { getOrCreateDeviceId } from "@/lib/likes/device-id";

function buildLikeHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "X-Device-Id": getOrCreateDeviceId(),
  };
}

async function parseLikeResponse(
  response: Response,
): Promise<CardLikeResponse> {
  const body = (await response.json()) as {
    data: CardLikeResponse | null;
    error: { code: string; message: string } | null;
  };

  if (!response.ok || body.error || !body.data) {
    throw new Error(body.error?.message ?? "Could not update like state.");
  }

  return body.data;
}

export async function fetchCardLikeStatus(
  cardId: string,
): Promise<CardLikeResponse> {
  const response = await fetch(`/api/cards/${cardId}/like`, {
    method: "GET",
    headers: buildLikeHeaders(),
    cache: "no-store",
  });

  return parseLikeResponse(response);
}

export async function toggleCardLike(
  cardId: string,
): Promise<CardLikeResponse> {
  const response = await fetch(`/api/cards/${cardId}/like`, {
    method: "POST",
    headers: buildLikeHeaders(),
  });

  return parseLikeResponse(response);
}
