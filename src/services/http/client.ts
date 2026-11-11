import { env } from "@/shared/config/env";
import { AppError, kindFromStatus, toAppError } from "@/shared/lib/errors";
import { isApiEnvelope } from "./envelope";

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  query?: Record<string, QueryValue>;
  /** Sent as JSON, unless it is FormData. */
  body?: unknown | FormData;
  timeoutMs?: number;
}

export interface HttpClientConfig {
  baseUrl: string;
  getToken?: () =>
    string | null | undefined | Promise<string | null | undefined>;
  /** Sent as `Accept-Language` (the backend localizes `message`), unless the caller sets it. */
  getLocale?: () =>
    string | null | undefined | Promise<string | null | undefined>;
  /** Called (and awaited) on a 401 (HTTP or body `code`), before the `unauthorized` AppError is thrown. */
  onUnauthorized?: () => void | Promise<void>;
}

const DEFAULT_TIMEOUT_MS = 15000;
const SENSITIVE_KEY = /authorization|cookie|password|secret|token/i;
let nextRequestId = 1;

/** Development-only transport diagnostics. Never logs credentials or file data. */
function httpLog(
  event: "request" | "response" | "error",
  details: unknown,
): void {
  if (process.env.NODE_ENV !== "development") return;
  // eslint-disable-next-line no-console -- intentional local HTTP inspection.
  console.info(`[http] ${event}`, details);
}

/** Makes request / response values safe and readable in a development log. */
function toLogValue(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof FormData !== "undefined" && value instanceof FormData) {
    const entries: Record<string, unknown> = {};
    value.forEach((entry, entryKey) => {
      const current = entries[entryKey];
      const logged = toLogValue(entry, entryKey);
      entries[entryKey] = current === undefined ? logged : [current, logged];
    });
    return entries;
  }
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return {
      file:
        typeof File !== "undefined" && value instanceof File
          ? value.name
          : undefined,
      type: value.type,
      size: value.size,
    };
  }
  if (Array.isArray(value)) return value.map((item) => toLogValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entry]) => [
        entryKey,
        toLogValue(entry, entryKey),
      ]),
    );
  }
  return value;
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: RequestOptions["query"],
): string {
  const url = `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  if (!query) return url;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null)
      params.append(key, String(value));
  });
  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/**
 * fetch wrapper: base URL, timeout, JSON, auth and language headers. Every
 * failure leaves it as an AppError, so nothing above this layer handles raw
 * fetch errors.
 *
 * Outcome (docs/api/Auth-API.md rule R1): HTTP 401 and 5xx decide by the HTTP
 * status and ignore the body. Otherwise the envelope's `code` decides as it
 * is: a validation error is HTTP 200 with `code: 422`. A successful call
 * returns the whole body (for the API, the envelope with `data` and `message`).
 */
export function createHttpClient({
  baseUrl,
  getToken,
  getLocale,
  onUnauthorized,
}: HttpClientConfig) {
  async function fail(
    status: number,
    body: unknown,
    cause?: unknown,
  ): Promise<never> {
    if (status === 401) await onUnauthorized?.();
    const serverMessage = isApiEnvelope(body) ? body.message : undefined;
    throw new AppError(kindFromStatus(status), undefined, status, undefined, {
      cause,
      serverMessage,
    });
  }

  async function request<T>(
    method: string,
    path: string,
    {
      query,
      body,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      headers,
      signal,
      ...init
    }: RequestOptions = {},
  ): Promise<T> {
    const requestId = nextRequestId++;
    const url = buildUrl(baseUrl, path, query);
    const startedAt = performance.now();
    const requestHeaders = new Headers(headers);
    requestHeaders.set("Accept", "application/json");
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !isFormData) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const token = await getToken?.();
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
    if (!requestHeaders.has("Accept-Language")) {
      const locale = await getLocale?.();
      if (locale) requestHeaders.set("Accept-Language", locale);
    }

    const controller = new AbortController();
    const timer = setTimeout(
      () =>
        controller.abort(new DOMException("Request timed out", "TimeoutError")),
      timeoutMs,
    );
    if (signal?.aborted) controller.abort(signal.reason);
    else
      signal?.addEventListener("abort", () => controller.abort(signal.reason), {
        once: true,
      });

    httpLog("request", {
      requestId,
      method,
      path,
      url,
      query: toLogValue(query),
      body: toLogValue(body),
    });

    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        method,
        headers: requestHeaders,
        body:
          body === undefined
            ? undefined
            : isFormData
              ? body
              : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      httpLog("error", {
        requestId,
        method,
        path,
        durationMs: Math.round(performance.now() - startedAt),
        error: toLogValue(error),
      });
      throw toAppError(error);
    } finally {
      clearTimeout(timer);
    }

    const payload =
      response.status === 204 ? undefined : await readJson(response);
    httpLog("response", {
      requestId,
      method,
      path,
      status: response.status,
      durationMs: Math.round(performance.now() - startedAt),
      data: toLogValue(payload),
    });

    if (response.status === 401 || response.status >= 500) {
      return fail(response.status, undefined, response);
    }
    if (response.status === 204) return undefined as T;

    const bodyCode = isApiEnvelope(payload) ? payload.code : undefined;
    const code =
      bodyCode !== undefined && bodyCode >= 400 ? bodyCode : response.status;
    if (!response.ok || code >= 400) return fail(code, payload, response);
    if (payload === undefined) {
      throw new AppError("server", undefined, response.status, undefined, {
        cause: response,
      });
    }
    return payload as T;
  }

  return {
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>("GET", path, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("POST", path, { ...options, body }),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("PUT", path, { ...options, body }),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("PATCH", path, { ...options, body }),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>("DELETE", path, options),
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;

/**
 * Anonymous client for public endpoints. The browser holds no backend token
 * (it lives in the NextAuth session cookie), so calls that need the customer
 * go through the server: services/http/server.ts.
 */
export const http = createHttpClient({
  baseUrl: env.publicApiUrl,
  getLocale: () =>
    typeof document === "undefined" ? undefined : document.documentElement.lang,
});
