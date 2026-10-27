import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({ publicServerHttp: { post } }));

import { authApi } from "./api";

beforeEach(() => {
  post.mockReset();
});

describe("authApi.requestOtp", () => {
  it("posts the login body and resolves with the backend message", async () => {
    post.mockResolvedValue({
      data: null,
      message: "OTP has been sent successfully.",
      code: 200,
    });

    await expect(
      authApi.requestOtp({ countryCode: "+966", phone: "544444442" }),
    ).resolves.toBe("OTP has been sent successfully.");
    expect(post).toHaveBeenCalledWith("/auth/request-otp", {
      phone: "544444442",
      phone_code: "+966",
      otp_type: "login",
    });
  });

  it("passes a backend validation error through", async () => {
    const error = new AppError("validation", undefined, 422, undefined, {
      serverMessage: "The phone number is required.",
    });
    post.mockRejectedValue(error);

    await expect(
      authApi.requestOtp({ countryCode: "+966", phone: "544444442" }),
    ).rejects.toBe(error);
  });

  it("rejects a success that is not an envelope", async () => {
    post.mockResolvedValue({ ok: true });

    await expect(
      authApi.requestOtp({ countryCode: "+966", phone: "544444442" }),
    ).rejects.toMatchObject({ kind: "server" });
  });
});
