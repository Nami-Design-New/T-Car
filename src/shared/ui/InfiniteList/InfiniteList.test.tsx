import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";
import { renderWithIntl } from "@/shared/test/render";
import { InfiniteList, type InfiniteListProps } from ".";

let observers: { callback: IntersectionObserverCallback; target?: Element }[] =
  [];

class FakeObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    observers.push({ callback: this.callback, target });
  }
  disconnect() {
    observers = observers.filter((entry) => entry.callback !== this.callback);
  }
}

/** Scrolls the list's end into view. */
function reachEnd() {
  act(() => {
    for (const { callback, target } of observers) {
      callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    }
  });
}

beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});
afterEach(() => vi.unstubAllGlobals());

interface ListProps extends Partial<InfiniteListProps> {
  items?: string[];
  skeletons?: number;
}

function renderList({
  items = ["Alpha", "Beta"],
  skeletons,
  ...overrides
}: ListProps = {}) {
  const props = {
    loading: false,
    hasMore: false,
    isEmpty: items.length === 0,
    onLoadMore: vi.fn(),
    ...overrides,
  };
  renderWithIntl(
    <InfiniteList {...props}>
      <InfiniteList.Items>
        {items.map((item) => (
          <InfiniteList.Item key={item}>{item}</InfiniteList.Item>
        ))}
      </InfiniteList.Items>
      <InfiniteList.Loading count={skeletons}>
        <div data-testid="card-skeleton" />
      </InfiniteList.Loading>
      <InfiniteList.Error />
      <InfiniteList.Empty>
        <p>Nothing here</p>
      </InfiniteList.Empty>
    </InfiniteList>,
  );
  return props;
}

describe("InfiniteList", () => {
  it("renders the items as a list", () => {
    renderList();
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["Alpha", "Beta"]);
    expect(screen.queryByTestId("card-skeleton")).not.toBeInTheDocument();
  });

  it("shows the card skeletons and a loading status on the first load", () => {
    renderList({ items: [], loading: true, skeletons: 4 });
    expect(screen.getAllByTestId("card-skeleton")).toHaveLength(4);
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(screen.queryByText("Nothing here")).not.toBeInTheDocument();
  });

  it("adds one skeleton below the items while the next page loads", () => {
    renderList({ loading: true, hasMore: true, skeletons: 4 });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByTestId("card-skeleton")).toHaveLength(1);
  });

  it("asks for the next page when its end scrolls into view", () => {
    const { onLoadMore } = renderList({ hasMore: true });
    reachEnd();
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it("does not watch the end while a page loads", () => {
    const { onLoadMore } = renderList({ hasMore: true, loading: true });
    reachEnd();
    expect(onLoadMore).not.toHaveBeenCalled();
    expect(observers).toHaveLength(0);
  });

  it("keeps loaded items and shows a failed page inline with a retry", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderList({ hasMore: true, error: new AppError("network"), onRetry });

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(observers).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("requires its parts to be inside the list", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderWithIntl(<InfiniteList.Error />)).toThrow(
      "InfiniteList.Error must be inside InfiniteList",
    );
  });

  it("shows the empty state once a list loaded with no items", () => {
    renderList({ items: [] });
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
