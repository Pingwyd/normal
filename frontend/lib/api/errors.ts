import type { ApiErrorBody } from "./types";

export class ApiRequestError extends Error {
  readonly code: string;

  constructor(error: ApiErrorBody) {
    super(error.message);
    this.name = "ApiRequestError";
    this.code = error.code;
  }
}
