import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get, put, post, delete: deleteRequest } = vi.hoisted(() => ({
  get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  serverHttp: { get, put, post, delete: deleteRequest },
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

describe("accountApi.uploadLicense", () => {
  it("sends the selected file as multipart data and returns the backend message", async () => {
    post.mockResolvedValue({
      data: { id: 1, user_id: 1, license: "licenses/license.png", created_at: "2026-10-29" },
      message: "License saved successfully.",
      code: 200,
    });
    const file = new File(["license"], "license.png", { type: "image/png" });

    await expect(accountApi.uploadLicense(file)).resolves.toEqual({
      ok: true, data: "licenses/license.png", message: "License saved successfully.",
    });
    const [, formData] = post.mock.calls[0];
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get("license")).toEqual(file);
  });
});

describe("accountApi.updateProfile", () => {
  it("sends editable fields and maps a response that omits the license", async () => {
    put.mockResolvedValue({
      code: 200,
      message: "Profile updated successfully.",
      data: { user: { name: "New Name", email: "new@example.com", birth_date: "1993-03-15" } },
    });

    await expect(accountApi.updateProfile({
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
    await expect(accountApi.updateProfile({
      fullName: "New Name", email: "new@example.com", birthDate: "1993-03-15",
    })).resolves.toEqual({ ok: false, error: new AppError("server") });
  });
});

describe("accountApi.deleteAccount", () => {
  it("uses the authenticated DELETE endpoint and returns its message", async () => {
    deleteRequest.mockResolvedValue({
      data: null,
      message: "Account deleted successfully.",
      code: 200,
    });

    await expect(accountApi.deleteAccount()).resolves.toEqual({
      ok: true,
      data: null,
      message: "Account deleted successfully.",
    });
    expect(deleteRequest).toHaveBeenCalledWith("/delete-account");
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
          license: { id: 1, license: "/licenses/license.png" },
        },
      }),
    );

    await expect(accountApi.getProfile()).resolves.toEqual({
      fullName: "Ahmed Abdullah",
      email: "ahmed@domain.com",
      birthDate: "1993-03-15",
      phone: "+966500000000",
      licenseUploaded: true,
      licenseUrl: expect.stringContaining("/licenses/license.png"),
      location: null,
    });
    expect(get).toHaveBeenCalledWith("/profile");
  });

  it("maps the saved location, keeping the Arabic region as it is", async () => {
    get.mockResolvedValue(
      envelope({
        user: {
          name: "Ahmed Abdullah",
          email: "ahmed@domain.com",
          phone: "500000000",
          phone_code: "+966",
          birth_date: "1993-03-15",
          license: null,
          latitude: "24.71360000",
          longitude: "46.67530000",
          region: "منطقة الرياض",
          address_name: "حي الصحافة، الرياض",
        },
      }),
    );

    await expect(accountApi.getProfile()).resolves.toMatchObject({
      location: {
        lat: 24.7136,
        lng: 46.6753,
        region: "منطقة الرياض",
        address: "حي الصحافة، الرياض",
      },
    });
  });

  it("maps null or unreadable coordinates to no location", async () => {
    const user = {
      name: "Ahmed Abdullah",
      email: "ahmed@domain.com",
      phone: "500000000",
      phone_code: "+966",
      birth_date: "1993-03-15",
      license: null,
      region: null,
      address_name: null,
    };
    get
      .mockResolvedValueOnce(envelope({ user: { ...user, latitude: null, longitude: null } }))
      .mockResolvedValueOnce(envelope({ user: { ...user, latitude: "abc", longitude: "46.6" } }))
      .mockResolvedValueOnce(envelope({ user: { ...user, latitude: "95", longitude: "46.6" } }));

    for (let call = 0; call < 3; call += 1) {
      await expect(accountApi.getProfile()).resolves.toMatchObject({ location: null });
    }
  });

  it("keeps coordinates without a region, which then send no location", async () => {
    get.mockResolvedValue(
      envelope({
        user: {
          name: "Ahmed Abdullah",
          email: "ahmed@domain.com",
          phone: "500000000",
          phone_code: "+966",
          birth_date: "1993-03-15",
          license: null,
          latitude: "24.7136",
          longitude: "46.6753",
          region: null,
          address_name: null,
        },
      }),
    );

    const profile = await accountApi.getProfile();
    expect(profile.location).toEqual({ lat: 24.7136, lng: 46.6753 });
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
