import type { Page } from "./pagination";

/** Read only the fields a screen uses; backend additions and missing fields stay harmless. */
export const apiObject = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const apiData = (response: unknown): Record<string, unknown> =>
  apiObject(apiObject(response).data);

export const apiList = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

export const apiText = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const apiNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export const apiCount = (value: unknown): number =>
  Math.max(0, apiNumber(value));

export const apiId = (value: unknown, fallback: string): string =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;

export function apiPage<T>(
  items: T[],
  response: unknown,
  requestedPage = 1,
): Page<T> {
  const pagination = apiObject(apiObject(response).pagination);
  const page = apiCount(pagination.current_page) || requestedPage;
  return {
    items,
    page,
    lastPage: Math.max(page, apiCount(pagination.last_page) || page),
    total: apiCount(pagination.total) || items.length,
  };
}
