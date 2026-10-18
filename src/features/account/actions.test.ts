import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "./model";
import { LICENSE_MAX_SIZE_BYTES } from "./model";

const { auth, accountApi } = vi.hoisted(() => ({
  auth: vi.fn(),
  accountApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    sendPhoneCode: vi.fn(),
    uploadLicense: vi.fn(),
    verifyPhone: vi.fn(),
  },
}));

vi.mock("@/auth", () => ({ auth, signOut: vi.fn() }));
vi.mock("@/services/account.api", () => ({ accountApi }));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import {
  saveProfileAction,
  sendPhoneCodeAction,
  uploadLicenseAction,
  verifyPhoneAction,
} from "./actions";

const stored: UserProfile = {
  fullName: "Stored Name",
  email: "stored@domain.com",
  birthDate: "1990-01-01",
  phone: "+966500000000",
  licenseUploaded: true,
};

const edits = {
  fullName: " New Name ",
  email: "new@domain.com",
  birthDate: "1993-03-15",
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "u1" } });
  accountApi.getProfile.mockResolvedValue({ ...stored });
  accountApi.updateProfile.mockImplementation(
    async (_id: string, profile: UserProfile) => profile,
  );
});

describe("saveProfileAction", () => {
  it("needs a session before it looks at the input", async () => {
    auth.mockResolvedValue(null);
    await expect(
      saveProfileAction({ fullName: "", email: "", birthDate: "" }),
    ).resolves.toEqual({
      ok: false,
      error: { kind: "unauthorized" },
    });
    expect(accountApi.updateProfile).not.toHaveBeenCalled();
  });

  it("rejects a malformed profile without saving", async () => {
    const result = await saveProfileAction({ ...edits, email: "nope" });
    expect(result).toEqual({
      ok: false,
      error: {
        kind: "validation",
        code: "account.invalidEmail",
        fieldErrors: { email: "account.invalidEmail" },
      },
    });
    expect(accountApi.updateProfile).not.toHaveBeenCalled();
  });

  it("saves the parsed edits and keeps the server-managed fields", async () => {
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
      phone: "+966500000000",
      licenseUploaded: true,
    });
    expect(result).toMatchObject({
      ok: true,
      data: { phone: "+966500000000" },
    });
  });

  it("passes a service field error through", async () => {
    const { AppError } = await import("@/shared/lib/errors");
    accountApi.updateProfile.mockRejectedValue(
      new AppError("validation", "account.profileRejected", undefined, {
        email: "account.profileRejected",
      }),
    );
    await expect(saveProfileAction(edits)).resolves.toMatchObject({
      ok: false,
      error: { fieldErrors: { email: "account.profileRejected" } },
    });
  });
});

describe("phone actions", () => {
  it("rejects a malformed phone without sending a code", async () => {
    const result = await sendPhoneCodeAction("+966");
    expect(result).toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        fieldErrors: { phone: "account.invalidPhone" },
      },
    });
    expect(accountApi.sendPhoneCode).not.toHaveBeenCalled();
  });

  it("sends the code to the trimmed phone", async () => {
    await expect(sendPhoneCodeAction(" 966511111111 ")).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(accountApi.sendPhoneCode).toHaveBeenCalledWith("u1", "966511111111");
  });

  it("rejects an incomplete code without verifying", async () => {
    const result = await verifyPhoneAction("966511111111", "12");
    expect(result).toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        fieldErrors: { code: "account.invalidCode" },
      },
    });
    expect(accountApi.verifyPhone).not.toHaveBeenCalled();
  });

  it("verifies a well-formed code", async () => {
    await expect(verifyPhoneAction("966511111111", "1234")).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(accountApi.verifyPhone).toHaveBeenCalledWith(
      "u1",
      "966511111111",
      "1234",
    );
  });
});

describe("uploadLicenseAction", () => {
  it("rechecks the 5 MB limit before calling the service", async () => {
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
