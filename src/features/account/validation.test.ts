import { afterEach, describe, expect, it, vi } from "vitest";
import { toValidationError } from "@/shared/lib/validation";
import { LICENSE_MAX_SIZE_BYTES } from "./model";
import {
  licenseUploadSchema,
  phoneChangeSchema,
  phoneCodeSchema,
  profileFormSchema,
  verifyPhoneSchema,
} from "./validation";

describe("profile full-name rules", () => {
  it("accepts a trimmed non-Latin full name", () => {
    expect(
      profileFormSchema.parse({
        fullName: " أحمد عبدالله ",
        email: "ahmed@domain.com",
        birthDate: "1993-03-15",
      }).fullName,
    ).toBe("أحمد عبدالله");
  });

  it.each([
    ["one character", "A", "auth.nameTooShort"],
    ["101 characters", "A".repeat(101), "auth.nameTooLong"],
    ["digits", "Ahmed 123", "auth.nameRequired"],
    ["punctuation", "Ahmed-Abdullah", "auth.nameRequired"],
  ])("rejects %s", (_, fullName, error) => {
    expect(
      fieldErrors(profileFormSchema.safeParse({ ...validProfile, fullName })),
    ).toEqual({
      fullName: error,
    });
  });
});

const validProfile = {
  fullName: "Ahmed Abdullah",
  email: "ahmed@domain.com",
  birthDate: "1993-03-15",
};

/** The `errors.*` key per field, as the Server Action would return it. */
function fieldErrors(result: {
  success: boolean;
  error?: Parameters<typeof toValidationError>[0];
}) {
  if (result.success || !result.error) return undefined;
  return toValidationError(result.error).fieldErrors;
}

describe("profileFormSchema", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts the editable fields and trims the text", () => {
    expect(
      profileFormSchema.parse({
        fullName: " Ahmed Abdullah  ",
        email: " ahmed@domain.com",
        birthDate: "1993-03-15",
      }),
    ).toEqual(validProfile);
  });

  it("drops server-managed fields the client sends", () => {
    expect(
      profileFormSchema.parse({
        ...validProfile,
        phone: "+966500000000",
        licenseUploaded: true,
      }),
    ).toEqual(validProfile);
  });

  it("reports every invalid field with an account key", () => {
    expect(
      fieldErrors(
        profileFormSchema.safeParse({
          fullName: " ",
          email: "",
          birthDate: "",
        }),
      ),
    ).toEqual({
      fullName: "auth.nameRequired",
      email: "auth.emailRequired",
      birthDate: "auth.birthDateRequired",
    });
  });

  it("rejects a malformed email and a future birth date", () => {
    vi.useFakeTimers({
      now: new Date("2026-10-18T12:00:00Z"),
      toFake: ["Date"],
    });
    expect(
      fieldErrors(
        profileFormSchema.safeParse({
          ...validProfile,
          email: "a@",
          birthDate: "2027-01-01",
        }),
      ),
    ).toEqual({
      email: "auth.invalidEmail",
      birthDate: "auth.invalidBirthDate",
    });
  });
});

describe("phone schemas", () => {
  it("checks the new phone number", () => {
    expect(phoneChangeSchema.parse({ phone: { countryCode: "+966", phone: "0511111111" } })).toEqual({
      phone: { countryCode: "+966", phone: "511111111" },
    });
    expect(fieldErrors(phoneChangeSchema.safeParse({ phone: { countryCode: "+966", phone: "1234567" } }))).toEqual(
      {
        phone: "auth.phoneTooShort",
      },
    );
    expect(fieldErrors(phoneChangeSchema.safeParse({ phone: { countryCode: "+966", phone: "1".repeat(16) } }))).toEqual({
      phone: "auth.phoneTooLong",
    });
  });

  it("needs exactly four code digits", () => {
    expect(phoneCodeSchema.safeParse({ code: "1234" }).success).toBe(true);
    expect(fieldErrors(phoneCodeSchema.safeParse({ code: "12" }))).toEqual({
      code: "account.invalidCode",
    });
  });

  it("checks both when verifying", () => {
    expect(
      fieldErrors(verifyPhoneSchema.safeParse({ phone: "1", code: "abcd" })),
    ).toEqual({
      phone: "auth.invalidPhone",
      code: "account.invalidCode",
    });
  });
});

describe("licenseUploadSchema", () => {
  const validLicense = {
    name: "license.png",
    size: LICENSE_MAX_SIZE_BYTES,
    type: "image/png",
  };

  it("accepts JPG, JPEG, and PNG files at the 15 MB boundary", () => {
    expect(licenseUploadSchema.safeParse({ file: validLicense }).success).toBe(
      true,
    );
    expect(
      licenseUploadSchema.safeParse({
        file: { ...validLicense, name: "license.jpg", type: "image/jpeg" },
      }).success,
    ).toBe(true);
    expect(
      licenseUploadSchema.safeParse({
        file: { ...validLicense, name: "license.jpeg", type: "image/jpeg" },
      }).success,
    ).toBe(true);
  });

  it("rejects a file over 15 MB and unsupported declared types", () => {
    expect(
      fieldErrors(
        licenseUploadSchema.safeParse({
          file: { ...validLicense, size: LICENSE_MAX_SIZE_BYTES + 1 },
        }),
      ),
    ).toEqual({
      file: "account.licenseTooLarge",
    });
    expect(
      fieldErrors(
        licenseUploadSchema.safeParse({
          file: { ...validLicense, type: "application/pdf" },
        }),
      ),
    ).toEqual({
      file: "account.licenseInvalidType",
    });
  });
});
