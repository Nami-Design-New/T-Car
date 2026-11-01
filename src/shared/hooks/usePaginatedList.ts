"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toAppError, type AppError } from "@/shared/lib/errors";
import { hasNextPage, type Page } from "@/shared/lib/pagination";
import { reportError } from "@/shared/lib/report";
import type { Result } from "@/shared/lib/result";

interface Options {
  /** Loads page 1 each time this becomes true (e.g. a dialog opening). */
  enabled?: boolean;
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
  { enabled = true, scope = "paginatedList" }: Options = {},
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
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

  useEffect(() => {
    if (enabled) void load(1);
    // Drop any response still in flight once disabled.
    else requestRef.current++;
  }, [enabled, load]);

  const loadMore = useCallback(() => {
    if (!loading && !error && hasMore) void load(page + 1);
  }, [loading, error, hasMore, page, load]);

  /** Loads the page that failed again (page 1 when nothing has loaded). */
  const retry = useCallback(() => void load(page + 1), [load, page]);

  /** Starts again from page 1. */
  const refresh = useCallback(() => void load(1), [load]);

  return { items, loading, error, hasMore, loadMore, retry, refresh };
}
