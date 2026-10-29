import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get, put, post } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  serverHttp: { get, put, post },
}));

import { accountApi } from "./api";

const envelope = (data: unknown) => ({
  data,
  message: "Profile retrieved successfully.",
  code: 200,
});

describe("accountApi.sendPhoneCode", () => {
  it("uses the authenticated change-phone endpoint and returns the backend message", async () => {
    post.mockResolvedValue({ data: null, message: "OTP has been sent successfully.", code: 200 });
    await expect(accountApi.sendPhoneCode({ countryCode: "+966", phone: "511111111" }))
      .resolves.toEqual({ ok: true, data: undefined, message: "OTP has been sent successfully." });
    expect(post).toHaveBeenCalledWith("/auth/request-otp", {
      phone: "511111111", phone_code: "+966", otp_type: "change_phone",
    });
  });

  it("returns backend validation failures and rejects malformed success payloads", async () => {
    const error = new AppError("validation", undefined, 422, undefined, { serverMessage: "The phone number is required." });
    post.mockRejectedValueOnce(error).mockResolvedValueOnce({ data: {}, message: "OK", code: 200 });
    const phone = { countryCode: "+966", phone: "511111111" };
    await expect(accountApi.sendPhoneCode(phone)).resolves.toEqual({ ok: false, error });
    await expect(accountApi.sendPhoneCode(phone)).resolves.toEqual({ ok: false, error: new AppError("server") });
  });
});

describe("accountApi.updateProfile", () => {
  it("sends editable fields and maps a response that omits the license", async () => {
    put.mockResolvedValue({
      code: 200,
      message: "Profile updated successfully.",
      data: { user: { name: "New Name", email: "new@example.com", birth_date: "1993-03-15" } },
    });

    await expect(accountApi.updateProfile("u1", {
      fullName: "New Name", email: "new@example.com", birthDate: "1993-03-15",
    })).resolves.toEqual({
      ok: true,
      data: { fullName: "New Name", email: "new@example.com", birthDate: "1993-03-15" },
      message: "Profile updated successfully.",
    });
    expect(put).toHaveBeenCalledWith("/update-profile", {
      name: "New Name", email: "new@example.com", birth_date: "1993-03-15",
    });
  });

  it("rejects a malformed update response", async () => {
    put.mockResolvedValue({ code: 200, message: "Saved", data: { user: { name: "New Name" } } });
    await expect(accountApi.updateProfile("u1", {
      fullName: "New Name", email: "new@example.com", birthDate: "1993-03-15",
    })).resolves.toEqual({ ok: false, error: new AppError("server") });
  });
});

describe("accountApi.getProfile", () => {
  it("maps the live profile response into the account model", async () => {
    get.mockResolvedValue(
      envelope({
        user: {
          name: "Ahmed Abdullah",
          email: "ahmed@domain.com",
          phone: "500000000",
          phone_code: "+966",
          birth_date: "1993-03-15",
          license: { id: 1 },
        },
      }),
    );

    await expect(accountApi.getProfile()).resolves.toEqual({
      fullName: "Ahmed Abdullah",
      email: "ahmed@domain.com",
      birthDate: "1993-03-15",
      phone: "+966500000000",
      licenseUploaded: true,
    });
    expect(get).toHaveBeenCalledWith("/profile");
  });

  it("maps a missing license to false", async () => {
    get.mockResolvedValue(
      envelope({
        user: {
          name: "Ahmed Abdullah",
          email: "ahmed@domain.com",
          phone: "500000000",
          phone_code: "+966",
          birth_date: "1993-03-15",
          license: null,
        },
      }),
    );

    await expect(accountApi.getProfile()).resolves.toMatchObject({
      licenseUploaded: false,
    });
  });

  it("rejects an unexpected response shape", async () => {
    get.mockResolvedValue(envelope({ user: { name: "Ahmed" } }));

    await expect(accountApi.getProfile()).rejects.toEqual(
      new AppError("server"),
    );
  });
});
