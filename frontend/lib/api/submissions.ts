import { apiPost } from "./client";
import type {
  ReportIssueCreateResponse,
  SubmissionCreateResponse,
} from "./types";

export async function createSubmission(questionText: string) {
  return apiPost<SubmissionCreateResponse>(
    "/v1/submissions",
    { question_text: questionText },
    { infoCodes: ["DUPLICATE_LIKELY"] },
  );
}

export async function reportCardIssue(cardId: string, description: string) {
  return apiPost<ReportIssueCreateResponse>(
    `/v1/cards/${cardId}/report-issue`,
    { description },
  );
}
