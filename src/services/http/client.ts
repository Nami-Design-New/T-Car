import { env } from '@/shared/config/env';
import { AppError, toAppError } from '@/shared/lib/errors';

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  query?: Record<string, QueryValue>;
  /** Sent as JSON. */
  body?: unknown;
  timeoutMs?: number;
}

export interface HttpClientConfig {
  baseUrl: string;
  getToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** Called on a 401, before the `unauthorized` AppError is thrown. */
  onUnauthorized?: () => void;
}

const DEFAULT_TIMEOUT_MS = 15000;

function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
  const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  if (!query) return url;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

/**
 * fetch wrapper: base URL, timeout, JSON, auth header. Every failure leaves it
 * as an AppError, so nothing above this layer handles raw fetch errors.
 */
export function createHttpClient({ baseUrl, getToken, onUnauthorized }: HttpClientConfig) {
  async function request<T>(
    method: string,
    path: string,
    { query, body, timeoutMs = DEFAULT_TIMEOUT_MS, headers, signal, ...init }: RequestOptions = {}
  ): Promise<T> {
    const requestHeaders = new Headers(headers);
    requestHeaders.set('Accept', 'application/json');
    if (body !== undefined) requestHeaders.set('Content-Type', 'application/json');

    const token = await getToken?.();
    if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new DOMException('Request timed out', 'TimeoutError')),
      timeoutMs
    );
    if (signal?.aborted) controller.abort(signal.reason);
    else signal?.addEventListener('abort', () => controller.abort(signal.reason), { once: true });

    let response: Response;
    try {
      response = await fetch(buildUrl(baseUrl, path, query), {
        ...init,
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      throw toAppError(error);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      if (response.status === 401) onUnauthorized?.();
      // Map the backend's error codes and field errors here once its contract is known.
      throw toAppError(response);
    }

    if (response.status === 204) return undefined as T;

    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new AppError('server', undefined, response.status, undefined, { cause: error });
    }
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('POST', path, { ...options, body }),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('PUT', path, { ...options, body }),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('PATCH', path, { ...options, body }),
    delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;

const TOKEN_KEY = 'tcar_token';

// Browser client. The localStorage token stays until the cookie session from
// docs/02-server-client-boundary.md replaces it; then this uses the server client.
export const http = createHttpClient({
  baseUrl: env.publicApiUrl,
  getToken: () => (typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)),
  onUnauthorized: () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
  },
});
