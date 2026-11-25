import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({ serverHttp: { get } }));

import { referralsApi } from "./api";
import { referralsMock } from "./api.mock";

const envelope = (data: unknown) => ({ data, message: "OK", code: 200 });

describe("referralsApi.getProgram", () => {
  it("maps the observed referral program and requests /referal-info", async () => {
    get.mockResolvedValueOnce(
      envelope({
        referal_code: "TCAR-T2FZ",
        referal_reword_value: 500,
        user_level_points: 0,
        user_can_replace_points: 0,
      }),
    );

    await expect(referralsApi.getProgram("user-1")).resolves.toEqual({
      code: "TCAR-T2FZ",
      rewardPoints: 500,
    });
    expect(get).toHaveBeenCalledWith("/referal-info");
  });

  it.each([
    [
      "envelope without a message",
      {
        data: { referal_code: "TCAR-T2FZ", referal_reword_value: 500 },
        code: 200,
      },
    ],
    ["missing code", envelope({ referal_reword_value: 500 })],
    ["empty code", envelope({ referal_code: "  ", referal_reword_value: 500 })],
    [
      "non-numeric reward",
      envelope({ referal_code: "TCAR-T2FZ", referal_reword_value: "500" }),
    ],
    [
      "negative reward",
      envelope({ referal_code: "TCAR-T2FZ", referal_reword_value: -1 }),
    ],
    [
      "non-finite reward",
      envelope({ referal_code: "TCAR-T2FZ", referal_reword_value: Infinity }),
    ],
  ])("rejects %s as a server error", async (_case, response) => {
    get.mockResolvedValueOnce(response);
    await expect(referralsApi.getProgram("user-1")).rejects.toEqual(
      new AppError("server"),
    );
  });

  it("propagates an unauthorized transport error unchanged", async () => {
    const error = new AppError("unauthorized");
    get.mockRejectedValueOnce(error);
    await expect(referralsApi.getProgram("user-1")).rejects.toBe(error);
  });
});

describe("referralsApi", () => {
  it("keeps history and code checks on the mock", () => {
    expect(referralsApi.getHistory).toBe(referralsMock.getHistory);
    expect(referralsApi.checkCode).toBe(referralsMock.checkCode);
  });
});
