"use client";

import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/cn";
import { ErrorState } from "@/shared/ui/ErrorState";

/*
 * How to use
 * ----------
 * 1. Load the pages with `usePaginatedList` (shared/hooks). Its fetch takes a
 *    1-based page number and returns `Result<Page<T>>`; from a Server Action,
 *    wrap it in `fromActionResult`. Keep the fetch stable (`useCallback`).
 * 2. Pass the hook's state to `<InfiniteList>` and choose the parts to show.
 *
 *   const fetchPage = useCallback(
 *     async (page: number) => fromActionResult(await getAccountsAction(page)),
 *     [],
 *   );
 *   const accounts = usePaginatedList(fetchPage, { enabled: open });
 *
 *   <InfiniteList
 *     loading={accounts.loading}
 *     hasMore={accounts.hasMore}
 *     isEmpty={accounts.items.length === 0}
 *     error={accounts.error ?? undefined}
 *     onLoadMore={accounts.loadMore}
 *     onRetry={accounts.retry}
 *   >
 *     <InfiniteList.Items className="flex flex-col gap-2.5">
 *       {accounts.items.map((account) => (
 *         <InfiniteList.Item key={account.id}>
 *           <AccountCard account={account} />
 *         </InfiniteList.Item>
 *       ))}
 *     </InfiniteList.Items>
 *     <InfiniteList.Loading count={3} className="flex flex-col gap-2.5">
 *       <AccountCardSkeleton />
 *     </InfiniteList.Loading>
 *     <InfiniteList.Error />
 *     <InfiniteList.Empty>
 *       <EmptyState title={t("empty")} size="inline" />
 *     </InfiniteList.Empty>
 *   </InfiniteList>
 *
 * Parts (each renders only when it applies; use the ones you need, in the
 * order they should appear):
 * - `Items` / `Item`: a `ul` / `li`; nothing until an item has loaded.
 * - `Loading`: its child (one item's skeleton) `count` times on the first
 *   load, once below the items for a next page, plus a hidden "Loading…".
 * - `Error`: the failed page inline with "Try again" (`onRetry`); loaded items
 *   stay.
 * - `Empty`: its children once the list loaded with no items.
 *
 * The root adds the end marker itself. It watches the marker only while
 * another page exists and nothing is loading or failed, so `onLoadMore` never
 * runs twice for one page. Inside a scrolling container (e.g. `Dialog.Body`)
 * nothing extra is needed. `usePaginatedList` with `enabled` reloads from
 * page 1 each time it turns true (e.g. a dialog reopening).
 */

export interface Props {
  /** A page is loading (the hook's `loading`). */
  loading: boolean;
  /** Another page exists (the hook's `hasMore`). */
  hasMore: boolean;
  /** True while no item has loaded; the first load shows more skeletons. */
  isEmpty: boolean;
  /** Set when a page failed; `InfiniteList.Error` shows it with a retry. */
  error?: unknown;
  /** Loads the next page (the hook's `loadMore`). */
  onLoadMore: () => void;
  /** Loads the failed page again (the hook's `retry`). */
  onRetry?: () => void;
  className?: string;
  children: ReactNode;
}

type ListState = Omit<Props, "className" | "children">;

const ListContext = createContext<ListState | null>(null);

function useList(part: string): ListState {
  const state = useContext(ListContext);
  if (!state)
    throw new Error(`InfiniteList.${part} must be inside InfiniteList`);
  return state;
}

/**
 * A list that loads its next page when its end scrolls into view (doc 6).
 * Pair it with `usePaginatedList`; the parts below decide what shows. Works
 * inside any scroll container: the observer uses the viewport, which
 * ancestors with overflow clip.
 */
function InfiniteListRoot({ className, children, ...state }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { hasMore, loading, error, onLoadMore } = state;
  const canLoadMore = hasMore && !loading && !error;

  // Recreated after each load, so a sentinel that is still visible (a short
  // page) asks for the next one straight away.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !canLoadMore ||
      !sentinel ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) onLoadMore();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMore, onLoadMore]);

  return (
    <ListContext.Provider value={state}>
      <div className={className} aria-busy={loading}>
        {children}
        {canLoadMore && (
          <div ref={sentinelRef} className="h-px" aria-hidden="true" />
        )}
      </div>
    </ListContext.Provider>
  );
}

/** The loaded items; renders nothing until one has loaded. */
function Items({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isEmpty } = useList("Items");
  if (isEmpty) return null;
  return <ul className={cn("m-0 list-none p-0", className)}>{children}</ul>;
}

function Item({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <li className={className}>{children}</li>;
}

interface LoadingProps {
  /** Skeletons on the first load; a next page shows one. */
  count?: number;
  className?: string;
  /** One item's skeleton, e.g. a card. */
  children: ReactNode;
}

/** Repeats its skeleton while a page loads, with a visually hidden status. */
function Loading({ count = 3, className, children }: LoadingProps) {
  const { loading, isEmpty } = useList("Loading");
  const t = useTranslations("states");
  if (!loading) return null;

  return (
    <div className={className}>
      {Array.from({ length: isEmpty ? count : 1 }, (_, index) => (
        <Fragment key={index}>{children}</Fragment>
      ))}
      <span className="sr-only" role="status">
        {t("loading")}
      </span>
    </div>
  );
}

/** A failed page, inline with a retry; loaded items stay above it. */
function ListError() {
  const { error, onRetry } = useList("Error");
  if (!error) return null;
  return <ErrorState error={error} onRetry={onRetry} size="inline" />;
}

/** Shown once the list loaded with no items. */
function Empty({ children }: { children: ReactNode }) {
  const { loading, error, isEmpty } = useList("Empty");
  if (loading || error || !isEmpty) return null;
  return <>{children}</>;
}

export const InfiniteList = Object.assign(InfiniteListRoot, {
  Items,
  Item,
  Loading,
  Error: ListError,
  Empty,
});
