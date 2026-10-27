/** Every backend response, success or failure (docs/api/Auth-API.md §3). */
export interface ApiEnvelope<T> {
  /** `null` on every error and on writes without a payload. */
  data: T;
  /** Localized by `Accept-Language`; shown as a toast for success and validation. */
  message: string;
  /** The real outcome. A validation error is HTTP 200 with `code: 422`. */
  code: number;
}

export interface ApiPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ApiPage<T> extends ApiEnvelope<T[]> {
  pagination: ApiPagination;
}

export function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof (value as { code?: unknown }).code === "number" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}
