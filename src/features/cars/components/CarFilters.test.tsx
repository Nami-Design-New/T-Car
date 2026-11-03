import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import CarFilters from "./CarFilters";

const { replace, searchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: { current: new URLSearchParams("brands=toyota") },
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/cities/1",
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.current,
}));

const priceRange = { min: 5, max: 55 };

function typeSearch(value: string) {
  const [input] = screen.getAllByPlaceholderText(
    "Search for a car or brand...",
  );
  fireEvent.change(input, { target: { value } });
}

beforeEach(() => {
  vi.useFakeTimers();
  replace.mockClear();
  searchParams.current = new URLSearchParams("brands=toyota");
});

afterEach(() => vi.useRealTimers());

describe("CarFilters live search", () => {
  it("writes the search to the URL once typing pauses, keeping other params", () => {
    renderWithIntl(<CarFilters brands={[]} priceRange={priceRange} />);

    typeSearch("k");
    typeSearch("ki");
    typeSearch("kia ");
    act(() => vi.advanceTimersByTime(399));
    expect(replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/cities/1?brands=toyota&q=kia", {
      scroll: false,
    });
  });

  it("removes the search from the URL when the box is emptied", () => {
    searchParams.current = new URLSearchParams("q=kia");
    renderWithIntl(<CarFilters brands={[]} priceRange={priceRange} />);

    typeSearch("");
    act(() => vi.advanceTimersByTime(400));
    expect(replace).toHaveBeenCalledWith("/cities/1", { scroll: false });
  });

  it("does not search live in the hero drawer, which applies on demand", () => {
    renderWithIntl(
      <CarFilters
        brands={[]}
        priceRange={priceRange}
        onApply={vi.fn()}
        embedded
      />,
    );

    typeSearch("kia");
    act(() => vi.advanceTimersByTime(1000));
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("CarFilters brands", () => {
  const cityOptions = {
    brands: Array.from({ length: 9 }, (_, index) => ({
      id: `b${index}`,
      title: `Brand ${index}`,
    })),
    types: [],
    companies: [],
    services: [],
  };

  it("shows three brands and expands the rest from the +N more chip", () => {
    renderWithIntl(
      <CarFilters brands={[]} cityOptions={cityOptions} priceRange={priceRange} />,
    );

    expect(screen.queryAllByText(/^Brand \d$/)).toHaveLength(3);
    fireEvent.click(screen.getAllByRole("button", { name: "+6 more" })[0]);
    expect(screen.queryAllByText(/^Brand \d$/)).toHaveLength(9);
    expect(
      screen.getAllByRole("button", { name: "Show less" }).length,
    ).toBeGreaterThan(0);
  });
});
