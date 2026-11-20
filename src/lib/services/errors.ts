import type { PostgrestError } from "@supabase/supabase-js";

/** Error thrown by every service function, so the UI can show one consistent message. */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/** Turn a PostgREST error into a ServiceError with a user-friendly message. */
export function toServiceError(error: PostgrestError, fallback: string): ServiceError {
  // 42501 = insufficient privilege (RLS refused the row)
  if (error.code === "42501") {
    return new ServiceError("You don't have permission to do that.", error.code, error);
  }
  // PGRST116 = .single() matched zero rows (missing, or hidden by RLS)
  if (error.code === "PGRST116") {
    return new ServiceError("That item could not be found.", error.code, error);
  }
  return new ServiceError(error.message || fallback, error.code, error);
}
