"use server";

import { revalidatePath } from "next/cache";

import { adminApiRequest } from "@/lib/admin/api";
import type {
  AdminReportedIssueStatus,
  AdminSubmissionStatus,
} from "@/lib/admin/queries";
import { ApiRequestError } from "@/lib/api/errors";

export type ModerationActionResult =
  { ok: true } | { ok: false; code: string; message: string };

export async function updateSubmissionAction(
  submissionId: string,
  payload: {
    status?: AdminSubmissionStatus;
    decision_notes?: string;
    resulting_card_id?: string | null;
  },
): Promise<ModerationActionResult> {
  try {
    await adminApiRequest(`/v1/admin/submissions/${submissionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    revalidatePath("/admin/submissions");
    revalidatePath(`/admin/submissions/${submissionId}`);
    return { ok: true };
  } catch (error) {
    return mapModerationError(error);
  }
}

export async function updateReportedIssueAction(
  issueId: string,
  payload: {
    status?: AdminReportedIssueStatus;
    resolution_notes?: string;
  },
): Promise<ModerationActionResult> {
  try {
    await adminApiRequest(`/v1/admin/reported-issues/${issueId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    revalidatePath("/admin/reported-issues");
    revalidatePath(`/admin/reported-issues/${issueId}`);
    return { ok: true };
  } catch (error) {
    return mapModerationError(error);
  }
}

function mapModerationError(error: unknown): ModerationActionResult {
  if (error instanceof ApiRequestError) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
    };
  }

  return {
    ok: false,
    code: "UNKNOWN",
    message:
      error instanceof Error
        ? error.message
        : "Something went wrong while saving.",
  };
}
