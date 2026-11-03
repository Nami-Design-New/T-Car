"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toAppError, type AppError } from "@/shared/lib/errors";
import { hasNextPage, type Page } from "@/shared/lib/pagination";
import { reportError } from "@/shared/lib/report";
import type { Result } from "@/shared/lib/result";

interface Options<T> {
  /** Loads page 1 each time this becomes true (e.g. a dialog opening). */
  enabled?: boolean;
  /**
   * A first page already rendered on the server: the list starts from it and
   * fetches only the pages after it (`refresh` still reloads page 1).
   */
  initialPage?: Page<T>;
  /** Scope for `reportError` when the fetch itself throws. */
  scope?: string;
}

/**
 * Pages of a list, loaded one at a time and appended (infinite scroll). Pair
 * it with `InfiniteList`. A response for an older request is dropped, so a
 * reopen or refresh never mixes two lists.
 */
export function usePaginatedList<T>(
  fetchPage: (page: number) => Promise<Result<Page<T>>>,
  { enabled = true, initialPage, scope = "paginatedList" }: Options<T> = {},
) {
  const [items, setItems] = useState<T[]>(initialPage?.items ?? []);
  const [page, setPage] = useState(initialPage?.page ?? 0);
  const [hasMore, setHasMore] = useState(
    initialPage ? hasNextPage(initialPage) : false,
  );
  /** Page 1 is loaded (or loading) for the current enabled period. */
  const startedRef = useRef(initialPage !== undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const requestRef = useRef(0);

  const load = useCallback(
    async (next: number) => {
      const request = ++requestRef.current;
      setLoading(true);
      setError(null);
      if (next === 1) {
        setItems([]);
        setPage(0);
        setHasMore(false);
      }
      try {
        const result = await fetchRef.current(next);
        if (request !== requestRef.current) return;
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setItems((current) =>
          next === 1 ? result.data.items : [...current, ...result.data.items],
        );
        setPage(result.data.page);
        setHasMore(hasNextPage(result.data));
      } catch (loadError) {
        if (request !== requestRef.current) return;
        reportError(loadError, { scope });
        setError(toAppError(loadError));
      } finally {
        if (request === requestRef.current) setLoading(false);
      }
    },
    [scope],
  );

  // A ref, not a flag in the effect: Strict Mode runs effects twice, and the
  // second run must not reload page 1 (or drop a server-rendered first page).
  useEffect(() => {
    if (enabled) {
      if (startedRef.current) return;
      startedRef.current = true;
      void load(1);
    } else {
      startedRef.current = false;
      // Drop any response still in flight once disabled.
      requestRef.current++;
    }
  }, [enabled, load]);

  const loadMore = useCallback(() => {
    if (!loading && !error && hasMore) void load(page + 1);
  }, [loading, error, hasMore, page, load]);

  /** Loads the page that failed again (page 1 when nothing has loaded). */
  const retry = useCallback(() => void load(page + 1), [load, page]);

  /** Starts again from page 1. */
  const refresh = useCallback(() => void load(1), [load]);

  // Page 1 is requested in an effect, after the first render (and the server
  // HTML). Until it has arrived or failed the list is loading, not empty.
  const awaitingFirstPage = enabled && page === 0 && !error;

  return {
    items,
    loading: loading || awaitingFirstPage,
    error,
    hasMore,
    loadMore,
    retry,
    refresh,
  };
}
