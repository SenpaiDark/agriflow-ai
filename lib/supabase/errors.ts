import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";

/** A Supabase result: `error` is set when the operation failed. */
interface PostgrestResult<T> {
  data: T;
  error: PostgrestError | null;
}

/** `.single()` returns this code when no row matched — a legitimate
 * "not found", not a failure the caller should treat as an error. */
const NO_ROWS = "PGRST116";

/**
 * Thrown when a database operation fails. Server actions let it propagate so
 * Next.js renders the nearest error boundary instead of the mutation
 * silently doing nothing.
 */
export class DataError extends Error {
  readonly action: string;
  readonly cause: PostgrestError;

  constructor(action: string, cause: PostgrestError) {
    super(`${action} failed: ${cause.message}`);
    this.name = "DataError";
    this.action = action;
    this.cause = cause;
  }
}

/**
 * Assert a write (insert/update/delete) succeeded. Logs and throws on error
 * so it is never silently swallowed.
 */
export function assertOk(
  { error }: Pick<PostgrestResult<unknown>, "error">,
  action: string
): void {
  if (error) {
    console.error(`[agriflow] ${action}:`, error);
    throw new DataError(action, error);
  }
}

/**
 * Unwrap a read whose row may legitimately be absent. A real database error
 * is logged and thrown; a plain "no rows" result returns `null` so callers
 * keep their existing not-found handling.
 */
export function unwrapMaybe<T>(
  { data, error }: PostgrestResult<T>,
  action: string
): T | null {
  if (error && error.code !== NO_ROWS) {
    console.error(`[agriflow] ${action}:`, error);
    throw new DataError(action, error);
  }
  return data ?? null;
}
