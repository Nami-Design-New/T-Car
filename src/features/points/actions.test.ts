import { describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { pointsApi } from "./api";
import { getPointsPageAction } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("./api", () => ({ pointsApi: { getPoints: vi.fn() } }));

describe("getPointsPageAction", () => {
  it("returns a page for a signed-in user", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    const page = { items: [], page: 2, lastPage: 2, total: 10 };
    vi.mocked(pointsApi.getPoints).mockResolvedValueOnce({
      summary: { tierPoints: 0, balance: 0, lastRedemption: null },
      page,
    });
    expect(await getPointsPageAction(2, "spent")).toEqual({
      ok: true,
      data: page,
    });
    expect(pointsApi.getPoints).toHaveBeenCalledWith("user-1", 2, "spent");
  });

  it("requires a session", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const result = await getPointsPageAction(1, "all");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("unauthorized");
  });

  it.each([0, -1, 1.5, NaN])("rejects page %s", async (page) => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    const result = await getPointsPageAction(page, "all");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("validation");
  });

  it.each(["used", "invalid", ""])("rejects filter %s", async (filter) => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    const result = await getPointsPageAction(1, filter as never);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("validation");
  });
});
