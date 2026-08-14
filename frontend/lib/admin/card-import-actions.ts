"use server";

import { revalidatePath } from "next/cache";

import { adminApiRequest } from "@/lib/admin/api";
import { ApiRequestError } from "@/lib/api/errors";

export type CardDraftImportPayload = {
  question: string;
  brief: string;
  suggested_category: string;
  suggested_tags?: string[];
  slug?: string;
  content_blocks?: Array<{
    position?: number;
    type: string;
    data: Record<string, unknown>;
  }>;
  sources?: Array<{
    title: string;
    author_or_org: string;
    url: string;
    tier: string;
    published_date?: string | null;
    accessed_date: string;
    metadata?: Record<string, unknown>;
  }>;
};

export type ImportCardDraftResult =
  { ok: true; cardId: string } | { ok: false; code: string; message: string };

export async function importCardDraftAction(
  payload: CardDraftImportPayload,
  options?: { createMissingTags?: boolean },
): Promise<ImportCardDraftResult> {
  try {
    const card = await adminApiRequest<{ id: string }>(
      "/v1/admin/cards/import-draft",
      {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          create_missing_tags: options?.createMissingTags ?? false,
        }),
      },
    );
    revalidatePath("/admin/cards");
    return { ok: true, cardId: card.id };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { ok: false, code: error.code, message: error.message };
    }

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while importing the draft.";
    return { ok: false, code: "INTERNAL_ERROR", message };
  }
}
