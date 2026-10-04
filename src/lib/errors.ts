import { jsonError } from "@/lib/http";

export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function logServerError(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[roveya:${scope}] ${message}`);
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) return jsonError(error.message, error.status);
  logServerError("request", error);
  return jsonError("Something went wrong. Please try again.", 500);
}
