"use server";

import { revalidatePath } from "next/cache";

import { adminApiRequest } from "@/lib/admin/api";
import { ApiRequestError } from "@/lib/api/errors";

export type ReflectionFormPayload = {
  title: string;
  slug: string;
  brief: string;
  format: "short" | "long";
  status: "draft" | "published";
  is_crisis_adjacent: boolean;
  tag_ids: string[];
  reflection_blocks: Array<{
    position: number;
    type: string;
    data: Record<string, unknown>;
    context_note: string | null;
  }>;
};

export type SaveReflectionResult =
  | { ok: true; id: string }
  | { ok: false; code: string; message: string };

export async function createReflectionAction(
  payload: ReflectionFormPayload,
): Promise<SaveReflectionResult> {
  try {
    const reflection = await adminApiRequest<{ id: string }>(
      "/v1/admin/reflections",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    revalidatePath("/admin/reflections");
    revalidatePath("/reflections");
    return { ok: true, id: reflection.id };
  } catch (error) {
    return mapSaveError(error);
  }
}

export async function updateReflectionAction(
  reflectionId: string,
  payload: Partial<ReflectionFormPayload>,
): Promise<SaveReflectionResult> {
  try {
    await adminApiRequest<{ id: string }>(
      `/v1/admin/reflections/${reflectionId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    revalidatePath("/admin/reflections");
    revalidatePath(`/admin/reflections/${reflectionId}`);
    revalidatePath("/reflections");
    return { ok: true, id: reflectionId };
  } catch (error) {
    return mapSaveError(error);
  }
}

function mapSaveError(error: unknown): SaveReflectionResult {
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
