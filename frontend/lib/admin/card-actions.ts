"use server";

import { revalidatePath } from "next/cache";

import { adminApiRequest } from "@/lib/admin/api";
import { blocksToPayload } from "@/lib/admin/card-editor-types";
import { ApiRequestError } from "@/lib/api/errors";

export type CardFormPayload = {
  category_id: string;
  question: string;
  brief: string;
  slug: string;
  status: "draft" | "published" | "unpublished";
  requires_clinical_review: boolean;
  tag_ids: string[];
  content_blocks: ReturnType<typeof blocksToPayload>;
  sources: Array<{
    title: string;
    author_or_org: string;
    url: string;
    tier: string;
    published_date: string | null;
    accessed_date: string;
    metadata: Record<string, unknown>;
  }>;
};

export type SaveCardResult =
  | { ok: true; cardId: string }
  | { ok: false; code: string; message: string; clinicalGate?: boolean };

export async function createCardAction(
  payload: CardFormPayload,
): Promise<SaveCardResult> {
  try {
    const card = await adminApiRequest<{ id: string }>("/v1/admin/cards", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    revalidatePath("/admin/cards");
    return { ok: true, cardId: card.id };
  } catch (error) {
    return mapSaveError(error, payload.requires_clinical_review);
  }
}

export async function updateCardAction(
  cardId: string,
  payload: Partial<CardFormPayload>,
  requiresClinicalReview: boolean,
): Promise<SaveCardResult> {
  try {
    await adminApiRequest<{ id: string }>(`/v1/admin/cards/${cardId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    revalidatePath("/admin/cards");
    revalidatePath(`/admin/cards/${cardId}`);
    if (payload.slug) {
      revalidatePath(`/cards/${payload.slug}`);
    }
    return { ok: true, cardId };
  } catch (error) {
    return mapSaveError(error, requiresClinicalReview);
  }
}

function mapSaveError(
  error: unknown,
  requiresClinicalReview: boolean,
): SaveCardResult {
  if (error instanceof ApiRequestError) {
    const clinicalGate =
      error.code === "FORBIDDEN" &&
      requiresClinicalReview &&
      error.message.includes("permission");
    return {
      ok: false,
      code: error.code,
      message: error.message,
      clinicalGate,
    };
  }

  const message =
    error instanceof Error ? error.message : "Something went wrong while saving.";
  return { ok: false, code: "INTERNAL_ERROR", message };
}
