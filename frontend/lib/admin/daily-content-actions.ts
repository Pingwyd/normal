"use server";

import { revalidatePath } from "next/cache";

import { adminApiRequest } from "@/lib/admin/api";
import type { DailyContentStatus } from "@/lib/api/daily-content-types";
import { ApiRequestError } from "@/lib/api/errors";

export type AffirmationFormPayload = {
  text: string;
  status: DailyContentStatus;
  tag_ids: string[];
};

export type QuoteFormPayload = {
  text: string;
  attributed_to: string;
  source_url: string | null;
  status: DailyContentStatus;
};

export type SaveDailyContentResult =
  { ok: true; id: string } | { ok: false; code: string; message: string };

export type DeleteDailyContentResult =
  { ok: true } | { ok: false; code: string; message: string };

export async function createAffirmationAction(
  payload: AffirmationFormPayload,
): Promise<SaveDailyContentResult> {
  try {
    const affirmation = await adminApiRequest<{ id: string }>(
      "/v1/admin/affirmations",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    revalidatePath("/admin/affirmations");
    return { ok: true, id: affirmation.id };
  } catch (error) {
    return mapSaveError(error);
  }
}

export async function updateAffirmationAction(
  affirmationId: string,
  payload: Partial<AffirmationFormPayload>,
): Promise<SaveDailyContentResult> {
  try {
    await adminApiRequest<{ id: string }>(
      `/v1/admin/affirmations/${affirmationId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    revalidatePath("/admin/affirmations");
    revalidatePath(`/admin/affirmations/${affirmationId}`);
    return { ok: true, id: affirmationId };
  } catch (error) {
    return mapSaveError(error);
  }
}

export async function createQuoteAction(
  payload: QuoteFormPayload,
): Promise<SaveDailyContentResult> {
  try {
    const quote = await adminApiRequest<{ id: string }>("/v1/admin/quotes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    revalidatePath("/admin/quotes");
    return { ok: true, id: quote.id };
  } catch (error) {
    return mapSaveError(error);
  }
}

export async function updateQuoteAction(
  quoteId: string,
  payload: Partial<QuoteFormPayload>,
): Promise<SaveDailyContentResult> {
  try {
    await adminApiRequest<{ id: string }>(`/v1/admin/quotes/${quoteId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${quoteId}`);
    return { ok: true, id: quoteId };
  } catch (error) {
    return mapSaveError(error);
  }
}

function mapSaveError(error: unknown): SaveDailyContentResult {
  if (error instanceof ApiRequestError) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
    };
  }

  const message =
    error instanceof Error
      ? error.message
      : "Something went wrong while saving.";
  return { ok: false, code: "INTERNAL_ERROR", message };
}

export async function deleteAffirmationAction(
  affirmationId: string,
): Promise<DeleteDailyContentResult> {
  try {
    await adminApiRequest<{ deleted: boolean; id: string }>(
      `/v1/admin/affirmations/${affirmationId}`,
      {
        method: "DELETE",
      },
    );
    revalidatePath("/admin/affirmations");
    return { ok: true };
  } catch (error) {
    return mapDeleteError(error);
  }
}

export async function deleteQuoteAction(
  quoteId: string,
): Promise<DeleteDailyContentResult> {
  try {
    await adminApiRequest<{ deleted: boolean; id: string }>(
      `/v1/admin/quotes/${quoteId}`,
      {
        method: "DELETE",
      },
    );
    revalidatePath("/admin/quotes");
    return { ok: true };
  } catch (error) {
    return mapDeleteError(error);
  }
}

function mapDeleteError(error: unknown): DeleteDailyContentResult {
  if (error instanceof ApiRequestError) {
    return { ok: false, code: error.code, message: error.message };
  }
  return {
    ok: false,
    code: "INTERNAL_ERROR",
    message: "Could not delete that item.",
  };
}
