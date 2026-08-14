"use server";

import { revalidatePath } from "next/cache";

import { adminApiRequest } from "@/lib/admin/api";
import { ApiRequestError } from "@/lib/api/errors";
import type { AdminTag } from "@/lib/admin/queries";

export type TagActionResult =
  { ok: true; tag?: AdminTag } | { ok: false; code: string; message: string };

export async function createAdminTagAction(
  name: string,
): Promise<TagActionResult> {
  try {
    const tag = await adminApiRequest<AdminTag>("/v1/admin/tags", {
      method: "POST",
      body: JSON.stringify({ name: name.trim() }),
    });
    revalidatePath("/admin/tags");
    return { ok: true, tag };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { ok: false, code: error.code, message: error.message };
    }
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Could not create that tag.",
    };
  }
}

export async function deleteAdminTagAction(
  tagId: string,
): Promise<TagActionResult> {
  try {
    await adminApiRequest(`/v1/admin/tags/${tagId}`, {
      method: "DELETE",
    });
    revalidatePath("/admin/tags");
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { ok: false, code: error.code, message: error.message };
    }
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Could not delete that tag.",
    };
  }
}
