import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfileChanges } from "./model";
import { LICENSE_MAX_SIZE_BYTES } from "./model";

const { auth, accountApi, updateSessionProfile } = vi.hoisted(() => ({
  auth: vi.fn(),
  updateSessionProfile: vi.fn(),
  accountApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    sendPhoneCode: vi.fn(),
    uploadLicense: vi.fn(),
    verifyPhone: vi.fn(),
  },
}));

vi.mock("@/auth", () => ({ auth, signOut: vi.fn(), updateSessionProfile }));
vi.mock("./api", () => ({ accountApi }));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import {
  saveProfileAction,
  sendPhoneCodeAction,
  uploadLicenseAction,
  verifyPhoneAction,
} from "./actions";

const edits = {
  fullName: " New Name ",
  email: "new@domain.com",
  birthDate: "1993-03-15",
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "u1" } });
  accountApi.updateProfile.mockImplementation(
    async (_id: string, profile: ProfileChanges) => ({ ok: true, data: profile, message: "Profile updated successfully." }),
  );
  accountApi.sendPhoneCode.mockResolvedValue({ ok: true, data: undefined, message: "Code sent." });
});

describe("saveProfileAction", () => {
  it("needs a session before it looks at the input", async () => {
    auth.mockResolvedValue(null);
    await expect(
      saveProfileAction({ fullName: "", email: "", birthDate: "" }),
    ).resolves.toMatchObject({
      ok: false,
      error: { kind: "unauthorized" },
    });
    expect(accountApi.updateProfile).not.toHaveBeenCalled();
  });

  it("rejects a malformed profile without saving", async () => {
    const result = await saveProfileAction({ ...edits, email: "nope" });
    expect(result).toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        code: "auth.invalidEmail",
        fieldErrors: { email: "auth.invalidEmail" },
      },
    });
    expect(accountApi.updateProfile).not.toHaveBeenCalled();
  });

  it("saves only the parsed editable fields", async () => {
    const fromClient = {
      ...edits,
      phone: "+966599999999",
      licenseUploaded: false,
    };
    const result = await saveProfileAction(fromClient);

    expect(accountApi.updateProfile).toHaveBeenCalledWith("u1", {
      fullName: "New Name",
      email: "new@domain.com",
      birthDate: "1993-03-15",
    });
    expect(result).toMatchObject({
      ok: true,
      data: { fullName: "New Name", email: "new@domain.com", birthDate: "1993-03-15" },
      message: "Profile updated successfully.",
    });
    expect(updateSessionProfile).toHaveBeenCalledWith({ name: "New Name", email: "new@domain.com" });
  });

  it("rejects an underage customer before calling the service", async () => {
    const result = await saveProfileAction({ ...edits, birthDate: "2020-01-01" });
    expect(result).toMatchObject({ ok: false, error: { fieldErrors: { birthDate: "auth.underAge" } } });
    expect(accountApi.updateProfile).not.toHaveBeenCalled();
    expect(updateSessionProfile).not.toHaveBeenCalled();
  });

  it("passes a service field error through", async () => {
    const { AppError } = await import("@/shared/lib/errors");
    accountApi.updateProfile.mockResolvedValue({
      ok: false,
      error: new AppError("validation", "account.profileRejected", undefined, {
        email: "account.profileRejected",
      }),
    });
    await expect(saveProfileAction(edits)).resolves.toMatchObject({
      ok: false,
      error: { fieldErrors: { email: "account.profileRejected" } },
    });
    expect(updateSessionProfile).not.toHaveBeenCalled();
  });

  it("preserves the backend validation message without changing the session", async () => {
    const { AppError } = await import("@/shared/lib/errors");
    accountApi.updateProfile.mockResolvedValue({
      ok: false,
      error: new AppError("validation", undefined, 422, undefined, { serverMessage: "Email already exists." }),
    });
    await expect(saveProfileAction(edits)).resolves.toMatchObject({
      ok: false,
      error: { kind: "validation", status: 422, serverMessage: "Email already exists." },
    });
    expect(updateSessionProfile).not.toHaveBeenCalled();
  });
});

describe("phone actions", () => {
  it("requires a session before requesting a code", async () => {
    auth.mockResolvedValue(null);
    await expect(sendPhoneCodeAction({ countryCode: "+966", phone: "511111111" })).resolves.toMatchObject({
      ok: false, error: { kind: "unauthorized" },
    });
    expect(accountApi.sendPhoneCode).not.toHaveBeenCalled();
  });

  it("rejects a malformed phone without sending a code", async () => {
    const result = await sendPhoneCodeAction({ countryCode: "+966", phone: "1234567" });
    expect(result).toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        fieldErrors: { phone: "auth.phoneTooShort" },
      },
    });
    expect(accountApi.sendPhoneCode).not.toHaveBeenCalled();
  });

  it("sends the normalized national phone and returns the message", async () => {
    await expect(sendPhoneCodeAction({ countryCode: "+966", phone: " 0511111111 " })).resolves.toEqual({
      ok: true,
      data: { countryCode: "+966", phone: "511111111" },
      message: "Code sent.",
    });
    expect(accountApi.sendPhoneCode).toHaveBeenCalledWith({ countryCode: "+966", phone: "511111111" });
  });

  it("preserves the backend validation message", async () => {
    const { AppError } = await import("@/shared/lib/errors");
    accountApi.sendPhoneCode.mockResolvedValueOnce({
      ok: false,
      error: new AppError("validation", undefined, 422, undefined, { serverMessage: "Phone already in use." }),
    });
    await expect(sendPhoneCodeAction({ countryCode: "+966", phone: "511111111" })).resolves.toMatchObject({
      ok: false, error: { kind: "validation", status: 422, serverMessage: "Phone already in use." },
    });
  });

  it("rejects an incomplete code without verifying", async () => {
    const result = await verifyPhoneAction({ countryCode: "+966", phone: "511111111" }, "12");
    expect(result).toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        fieldErrors: { code: "account.invalidCode" },
      },
    });
    expect(accountApi.verifyPhone).not.toHaveBeenCalled();
  });

  it("updates the session after the phone is verified", async () => {
    accountApi.verifyPhone.mockResolvedValueOnce({ ok: true, data: "+966511111111", message: "Verified." });
    await expect(verifyPhoneAction({ countryCode: "+966", phone: "511111111" }, "1234")).resolves.toMatchObject({
      ok: true,
      data: "+966511111111",
    });
    expect(accountApi.verifyPhone).toHaveBeenCalledWith({ countryCode: "+966", phone: "511111111" }, "1234");
  });
});

describe("uploadLicenseAction", () => {
  it("rechecks the 15 MB limit before calling the service", async () => {
    const formData = new FormData();
    formData.set(
      "license",
      new File([new Uint8Array(LICENSE_MAX_SIZE_BYTES + 1)], "license.png", {
        type: "image/png",
      }),
    );

    await expect(uploadLicenseAction(formData)).resolves.toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        code: "account.licenseTooLarge",
        fieldErrors: { file: "account.licenseTooLarge" },
      },
    });
    expect(accountApi.uploadLicense).not.toHaveBeenCalled();
  });

  it("passes an accepted licence image to the service", async () => {
    const formData = new FormData();
    formData.set(
      "license",
      new File(["license"], "license.jpg", { type: "image/jpeg" }),
    );

    await expect(uploadLicenseAction(formData)).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(accountApi.uploadLicense).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        name: "license.jpg",
        size: 7,
        type: "image/jpeg",
      }),
    );
  });
});
