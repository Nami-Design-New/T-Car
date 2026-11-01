import { describe, expect, it } from "vitest";
import { hasNextPage, isPaginationDto, toPage } from "./pagination";

const pagination = {
  current_page: 1,
  last_page: 3,
  per_page: 10,
  total: 25,
  from: 1,
  to: 10,
};

describe("pagination", () => {
  it("maps the API pagination block into a page", () => {
    expect(isPaginationDto(pagination)).toBe(true);
    expect(toPage(["a"], pagination)).toEqual({
      items: ["a"],
      page: 1,
      lastPage: 3,
      total: 25,
    });
  });

  it("rejects a missing or malformed pagination block", () => {
    for (const value of [
      null,
      {},
      { ...pagination, current_page: "1" },
      { ...pagination, last_page: -1 },
      { ...pagination, total: 1.5 },
    ]) {
      expect(isPaginationDto(value)).toBe(false);
    }
  });

  it("knows when another page exists", () => {
    expect(hasNextPage({ page: 1, lastPage: 3 })).toBe(true);
    expect(hasNextPage({ page: 3, lastPage: 3 })).toBe(false);
    expect(hasNextPage({ page: 1, lastPage: 0 })).toBe(false);
  });
});
