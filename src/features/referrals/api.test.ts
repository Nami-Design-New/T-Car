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

describe("referralsApi.getHistory", () => {
  const invite = {
    id: 1,
    user_name: "Ahmed",
    points: null,
    status: "pending",
    joint_at: "2026-11-25 12:18:04",
    first_order_at: null,
  };
  const data = {
    referal_rewords: [invite],
    referal_rewords_count: 3,
    applied_referal_rewords_count: 2,
    referal_points: 1000,
    pagination: {
      current_page: 2,
      last_page: 3,
      per_page: 10,
      total: 21,
      from: 11,
      to: 20,
    },
  };

  it("maps the observed nested page, counts, and statuses", async () => {
    get.mockResolvedValueOnce(
      envelope({
        ...data,
        referal_rewords: [
          invite,
          {
            ...invite,
            id: 2,
            status: "applied",
            points: 500,
            first_order_at: "2026-11-26 10:00:00",
          },
        ],
      }),
    );
    await expect(referralsApi.getHistory("user-1", 2)).resolves.toEqual({
      totalPoints: 1000,
      invitedCount: 3,
      completedCount: 2,
      page: {
        items: [
          {
            id: "1",
            friendName: "Ahmed",
            rewardPoints: null,
            status: "pending",
            joinedAt: invite.joint_at,
            firstBookingAt: null,
          },
          {
            id: "2",
            friendName: "Ahmed",
            rewardPoints: 500,
            status: "rewarded",
            joinedAt: invite.joint_at,
            firstBookingAt: "2026-11-26 10:00:00",
          },
        ],
        page: 2,
        lastPage: 3,
        total: 21,
      },
    });
    expect(get).toHaveBeenCalledWith("/referal-rewords", {
      query: { page: 2, per_page: 10 },
    });
  });

  it.each([
    ["malformed item", { ...data, referal_rewords: [{ ...invite, id: "1" }] }],
    [
      "unknown status",
      { ...data, referal_rewords: [{ ...invite, status: "other" }] },
    ],
    ["missing pagination", { ...data, pagination: undefined }],
    ["bad count", { ...data, referal_rewords_count: "3" }],
  ])("rejects %s", async (_name, payload) => {
    get.mockResolvedValueOnce(envelope(payload));
    await expect(referralsApi.getHistory("user-1", 1)).rejects.toEqual(
      new AppError("server"),
    );
  });

  it("rejects a non-success envelope", async () => {
    get.mockResolvedValueOnce({ ...envelope(data), code: 422 });
    await expect(referralsApi.getHistory("user-1", 1)).rejects.toEqual(
      new AppError("server"),
    );
  });

  it("propagates a 401 unchanged", async () => {
    const error = new AppError("unauthorized");
    get.mockRejectedValueOnce(error);
    await expect(referralsApi.getHistory("user-1", 1)).rejects.toBe(error);
  });

  it("keeps code checks on the mock", () => {
    expect(referralsApi.checkCode).toBe(referralsMock.checkCode);
  });
});
