import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { post, sessionPost } = vi.hoisted(() => ({
  post: vi.fn(),
  sessionPost: vi.fn(),
}));

vi.mock("server-only", () => ({}));
// publicServerHttp sends no token; serverHttp sends the session's.
vi.mock("@/services/http/server", () => ({
  publicServerHttp: { post },
  serverHttp: { post: sessionPost },
}));

import { authApi } from "./api";

beforeEach(() => {
  post.mockReset();
  sessionPost.mockReset();
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

describe("authApi.verifyOtp", () => {
  const user = {
    id: 34,
    name: null,
    phone: "544444442",
    email: null,
    phone_code: "+966",
    birth_date: null,
    latitude: null,
    longitude: null,
    region: null,
    address_name: null,
    lang: "en",
    balance: 0,
    withdrawable_balance: 0,
    non_withdrawable_balance: 0,
    created_at: "2026-10-27 05:50:36",
  };
  const verified = (data: Record<string, unknown>) => ({
    data: {
      user,
      token: "34|secret",
      new_user: true,
      current_step: "register",
      ...data,
    },
    message: "OTP verified successfully.",
    code: 200,
  });
  const phone = { countryCode: "+966", phone: "544444442" };

  it("posts the code and maps the grant", async () => {
    post.mockResolvedValue(verified({}));

    await expect(authApi.verifyOtp(phone, "1234")).resolves.toEqual({
      accessToken: "34|secret",
      user: { id: "34", name: "", phone: "+966544444442", email: undefined },
      onboardingStep: "register",
    });
    expect(post).toHaveBeenCalledWith("/auth/verify-otp", {
      phone: "544444442",
      phone_code: "+966",
      otp: "1234",
      otp_type: "login",
    });
  });

  it.each([
    ["location", "Test", "location"],
    ["completed", "Test", "completed"],
    [null, "Test", "completed"],
    [null, null, "register"],
  ])("maps current_step %s (name %s) to %s", async (step, name, expected) => {
    post.mockResolvedValue(
      verified({
        current_step: step,
        new_user: false,
        user: { ...user, name },
      }),
    );
    const grant = await authApi.verifyOtp(phone, "1234");
    expect(grant.onboardingStep).toBe(expected);
  });

  it("passes a wrong code (422) through with the backend message", async () => {
    const error = new AppError("validation", undefined, 422, undefined, {
      serverMessage: "The verification code is invalid or expired.",
    });
    post.mockRejectedValue(error);

    await expect(authApi.verifyOtp(phone, "0000")).rejects.toBe(error);
  });

  it.each([
    ["no token", { token: "" }],
    ["a user without an id", { user: { ...user, id: "34" } }],
    ["a missing new_user flag", { new_user: undefined }],
  ])("rejects a success with %s", async (_case, data) => {
    post.mockResolvedValue(verified(data));
    await expect(authApi.verifyOtp(phone, "1234")).rejects.toMatchObject({
      kind: "server",
    });
  });
});

describe("authApi.completeProfile", () => {
  const profileUser = {
    id: 34,
    name: "Test",
    phone: "593080235",
    email: "api.test@example.com",
    phone_code: "+966",
    birth_date: "2000-12-12",
    latitude: null,
    longitude: null,
    region: null,
    address_name: null,
    lang: "en",
    balance: 0,
    withdrawable_balance: 0,
    non_withdrawable_balance: 0,
    created_at: "2026-10-27 05:50:36",
  };
  const input = {
    fullName: "Test",
    email: "api.test@example.com",
    birthDate: "2000-12-12",
  };

  it("posts the profile with the session's client and maps the result", async () => {
    sessionPost.mockResolvedValue({
      data: { user: profileUser, current_step: "location" },
      message: "Profile updated successfully.",
      code: 200,
    });

    await expect(authApi.completeProfile(input)).resolves.toEqual({
      user: {
        id: "34",
        name: "Test",
        phone: "+966593080235",
        email: "api.test@example.com",
      },
      onboardingStep: "location",
      message: "Profile updated successfully.",
    });
    expect(sessionPost).toHaveBeenCalledWith("/complete-profile", {
      name: "Test",
      email: "api.test@example.com",
      birth_date: "2000-12-12",
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("passes a revoked token (401) through", async () => {
    const error = new AppError("unauthorized", undefined, 401);
    sessionPost.mockRejectedValue(error);
    await expect(authApi.completeProfile(input)).rejects.toBe(error);
  });

  it("rejects a success without the user", async () => {
    sessionPost.mockResolvedValue({
      data: { current_step: "location" },
      message: "Profile updated successfully.",
      code: 200,
    });
    await expect(authApi.completeProfile(input)).rejects.toMatchObject({
      kind: "server",
    });
  });
});

describe("authApi.assignLocation", () => {
  it("posts the location with the session's client and maps the step", async () => {
    sessionPost.mockResolvedValue({
      data: {
        user: {
          id: 34,
          name: "Test",
          phone: "593080235",
          email: "api.test@example.com",
          phone_code: "+966",
        },
        current_step: "completed",
      },
      message: "Location saved successfully.",
      code: 200,
    });

    const result = await authApi.assignLocation({
      latitude: 24.7136,
      longitude: 46.6753,
      addressName: "King Fahd Rd",
      region: "Riyadh Province",
    });

    expect(result.onboardingStep).toBe("completed");
    expect(result.message).toBe("Location saved successfully.");
    expect(sessionPost).toHaveBeenCalledWith("/assign-location", {
      latitude: 24.7136,
      longitude: 46.6753,
      address_name: "King Fahd Rd",
      region: "Riyadh Province",
    });
  });
});
