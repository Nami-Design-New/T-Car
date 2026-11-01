import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";
import type { Page } from "@/shared/lib/pagination";
import { fail, ok, type Result } from "@/shared/lib/result";

vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import { usePaginatedList } from "./usePaginatedList";

const page = (n: number, lastPage = 2): Result<Page<string>> =>
  ok({ items: [`item-${n}`], page: n, lastPage, total: lastPage });

const fetchPage = vi.fn<(n: number) => Promise<Result<Page<string>>>>();

beforeEach(() => {
  vi.clearAllMocks();
  fetchPage.mockImplementation(async (n) => page(n));
});

describe("usePaginatedList", () => {
  it("does nothing while disabled", () => {
    renderHook(() => usePaginatedList(fetchPage, { enabled: false }));
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("loads page 1, then appends the next page until the last", async () => {
    const { result } = renderHook(() => usePaginatedList(fetchPage));

    await waitFor(() => expect(result.current.items).toEqual(["item-1"]));
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() =>
      expect(result.current.items).toEqual(["item-1", "item-2"]),
    );
    expect(result.current.hasMore).toBe(false);

    act(() => result.current.loadMore());
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("keeps loaded items on a failed page and retries that page", async () => {
    fetchPage
      .mockImplementationOnce(async (n) => page(n))
      .mockImplementationOnce(async () => fail(new AppError("network")));
    const { result } = renderHook(() => usePaginatedList(fetchPage));

    await waitFor(() => expect(result.current.items).toEqual(["item-1"]));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.error?.kind).toBe("network"));
    expect(result.current.items).toEqual(["item-1"]);

    act(() => result.current.retry());
    await waitFor(() =>
      expect(result.current.items).toEqual(["item-1", "item-2"]),
    );
    expect(fetchPage).toHaveBeenLastCalledWith(2);
    expect(result.current.error).toBeNull();
  });

  it("turns a thrown fetch into an AppError", async () => {
    fetchPage.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => usePaginatedList(fetchPage));

    await waitFor(() => expect(result.current.error).toBeInstanceOf(AppError));
  });

  it("starts again from page 1 when re-enabled, dropping a stale response", async () => {
    let resolveFirst: (value: Result<Page<string>>) => void = () => {};
    fetchPage.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { result, rerender } = renderHook(
      ({ enabled }) => usePaginatedList(fetchPage, { enabled }),
      { initialProps: { enabled: true } },
    );

    rerender({ enabled: false });
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.items).toEqual(["item-1"]));

    await act(async () =>
      resolveFirst(ok({ items: ["stale"], page: 1, lastPage: 1, total: 1 })),
    );
    expect(result.current.items).toEqual(["item-1"]);
  });
});
