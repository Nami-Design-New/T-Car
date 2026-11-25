import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get, post, sessionPost } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  sessionPost: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  serverHttp: { get, post: sessionPost },
  publicServerHttp: { post },
}));

import { referralsApi } from "./api";

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
});

describe("referralsApi.checkCode", () => {
  it.each(["Ahmed", null])(
    "uses the public client and maps a valid code with name %s",
    async (name) => {
      post.mockResolvedValueOnce(
        envelope({ valid: true, referrer_name: name }),
      );
      await expect(referralsApi.checkCode("TCAR-T2FZ")).resolves.toEqual({
        valid: true,
        inviterName: name,
      });
      expect(post).toHaveBeenCalledWith("/auth/verify-referal-code", {
        referal_code: "TCAR-T2FZ",
      });
      expect(sessionPost).not.toHaveBeenCalled();
    },
  );

  it.each(["", "   "])(
    "maps a blank referrer name %j to no name",
    async (name) => {
      post.mockResolvedValueOnce(
        envelope({ valid: true, referrer_name: name }),
      );
      await expect(referralsApi.checkCode("TCAR-T2FZ")).resolves.toEqual({
        valid: true,
        inviterName: null,
      });
    },
  );

  it("rethrows a validation error that is not a 422", async () => {
    const error = new AppError("validation", undefined, 400);
    post.mockRejectedValueOnce(error);
    await expect(referralsApi.checkCode("TCAR-T2FZ")).rejects.toBe(error);
  });

  it("maps the transport's body-code 422 to invalid", async () => {
    post.mockRejectedValueOnce(new AppError("validation", undefined, 422));
    await expect(referralsApi.checkCode("TCAR-UNKNOWN")).resolves.toEqual({
      valid: false,
    });
  });

  it.each([
    envelope({ valid: true }),
    envelope({ valid: false, referrer_name: null }),
    envelope({ valid: true, referrer_name: 3 }),
    { data: { valid: true, referrer_name: null }, code: 200 },
  ])("rejects a malformed success", async (response) => {
    post.mockResolvedValueOnce(response);
    await expect(referralsApi.checkCode("TCAR-T2FZ")).rejects.toEqual(
      new AppError("server"),
    );
  });

  it("propagates a network failure", async () => {
    const error = new AppError("network");
    post.mockRejectedValueOnce(error);
    await expect(referralsApi.checkCode("TCAR-T2FZ")).rejects.toBe(error);
  });
});
