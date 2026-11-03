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
