import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { AppError } from "@/shared/lib/errors";
import { referralsApi } from "./api";
import { checkReferralCodeAction, getReferralHistoryAction } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("./api", () => ({ referralsApi: { getHistory: vi.fn(), checkCode: vi.fn() } }));

describe("getReferralHistoryAction", () => {
  it("returns a page for a signed-in user", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    const page = { items: [], page: 2, lastPage: 2, total: 10 };
    const read = vi.spyOn(referralsApi, "getHistory").mockResolvedValueOnce({
      totalPoints: 0,
      invitedCount: 10,
      completedCount: 0,
      page,
    });
    expect(await getReferralHistoryAction(2)).toEqual({ ok: true, data: page });
    expect(read).toHaveBeenCalledWith("user-1", 2);
    read.mockRestore();
  });

  it("rejects a missing session", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const result = await getReferralHistoryAction(1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("unauthorized");
  });

  it.each([0, -1, 1.5, NaN])("rejects invalid page %s", async (page) => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    const result = await getReferralHistoryAction(page);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("validation");
  });
});

describe("checkReferralCodeAction", () => {
  beforeEach(() => vi.mocked(referralsApi.checkCode).mockReset());

  it("names the friend for a valid code, in any case", async () => {
    vi.mocked(referralsApi.checkCode).mockResolvedValueOnce({ valid: true, inviterName: "أحمد" });
    expect(await checkReferralCodeAction(" tcar-a7k9 ")).toEqual({
      ok: true,
      data: { valid: true, inviterName: "أحمد" },
    });
    expect(referralsApi.checkCode).toHaveBeenCalledWith("TCAR-A7K9");
  });

  it("rejects an unknown code", async () => {
    vi.mocked(referralsApi.checkCode).mockResolvedValueOnce({ valid: false });
    expect(await checkReferralCodeAction("TCAR-A7K0")).toEqual({
      ok: true,
      data: { valid: false },
    });
  });

  it("rejects a code in the wrong shape without asking the service", async () => {
    expect(await checkReferralCodeAction("A")).toEqual({
      ok: true,
      data: { valid: false },
    });
    expect(referralsApi.checkCode).not.toHaveBeenCalled();
  });

  it("rejects a code longer than 16 characters without asking the service", async () => {
    expect(await checkReferralCodeAction("TCAR-123456789012")).toEqual({
      ok: true,
      data: { valid: false },
    });
    expect(referralsApi.checkCode).not.toHaveBeenCalled();
  });

  it("returns a network error when the service is unreachable", async () => {
    vi.mocked(referralsApi.checkCode).mockRejectedValueOnce(new AppError("network"));
    const result = await checkReferralCodeAction("TCAR-FAIL");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("network");
  });
});
