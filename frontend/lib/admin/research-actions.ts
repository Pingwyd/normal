"use server";

import { revalidatePath } from "next/cache";

import { adminApiRequest } from "@/lib/admin/api";
import { ApiRequestError } from "@/lib/api/errors";

export type ResearchProviderOption = {
  provider: string;
  label: string;
  configured: boolean;
  key_hint: string | null;
};

export type ResearchJob = {
  id: string;
  question: string;
  status: "pending" | "complete" | "failed";
  provider: string;
  result: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

type JobResult =
  | { ok: true; job: ResearchJob }
  | { ok: false; code: string; message: string };

type DraftResult =
  | { ok: true; cardId: string }
  | { ok: false; code: string; message: string };

export async function fetchResearchProvidersAction(): Promise<
  ResearchProviderOption[] | { ok: false; message: string }
> {
  try {
    return await adminApiRequest<ResearchProviderOption[]>(
      "/v1/admin/research/providers",
    );
  } catch (error) {
    return {
      ok: false,
      message: error instanceof ApiRequestError ? error.message : "Failed to load providers.",
    };
  }
}

export async function saveResearchProviderKeyAction(
  provider: string,
  apiKey: string,
): Promise<ActionResult & { provider?: ResearchProviderOption }> {
  try {
    const saved = await adminApiRequest<ResearchProviderOption>(
      `/v1/admin/research/providers/${provider}/credentials`,
      {
        method: "PUT",
        body: JSON.stringify({ api_key: apiKey }),
      },
    );
    revalidatePath("/admin/research");
    return { ok: true, provider: saved };
  } catch (error) {
    return mapError(error);
  }
}

export async function deleteResearchProviderKeyAction(
  provider: string,
): Promise<ActionResult> {
  try {
    await adminApiRequest(`/v1/admin/research/providers/${provider}/credentials`, {
      method: "DELETE",
    });
    revalidatePath("/admin/research");
    return { ok: true };
  } catch (error) {
    return mapError(error);
  }
}

export async function startResearchJobAction(
  question: string,
  provider: string,
): Promise<JobResult> {
  try {
    const job = await adminApiRequest<ResearchJob>("/v1/admin/research/jobs", {
      method: "POST",
      body: JSON.stringify({ question, provider }),
    });
    return { ok: true, job };
  } catch (error) {
    return mapJobError(error);
  }
}

export async function fetchResearchJobAction(jobId: string): Promise<JobResult> {
  try {
    const job = await adminApiRequest<ResearchJob>(
      `/v1/admin/research/jobs/${jobId}`,
    );
    return { ok: true, job };
  } catch (error) {
    return mapJobError(error);
  }
}

export async function createDraftFromResearchJobAction(
  jobId: string,
  options?: { createMissingTags?: boolean },
): Promise<DraftResult> {
  try {
    const card = await adminApiRequest<{ id: string }>(
      `/v1/admin/research/jobs/${jobId}/create-draft`,
      {
        method: "POST",
        body: JSON.stringify({
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
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Could not create a draft from this research job.",
    };
  }
}

function mapError(error: unknown): ActionResult {
  if (error instanceof ApiRequestError) {
    return { ok: false, code: error.code, message: error.message };
  }
  return {
    ok: false,
    code: "INTERNAL_ERROR",
    message: "Something went wrong while saving the API key.",
  };
}

function mapJobError(error: unknown): JobResult {
  if (error instanceof ApiRequestError) {
    return { ok: false, code: error.code, message: error.message };
  }
  return {
    ok: false,
    code: "INTERNAL_ERROR",
    message: "Something went wrong with the research job.",
  };
}
