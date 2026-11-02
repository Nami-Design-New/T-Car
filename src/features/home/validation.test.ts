import { describe, expect, it } from "vitest";
import { toValidationError } from "@/shared/lib/validation";
import { contactMessageSchema, joinUsSchema } from "./validation";

function fieldErrors(input: unknown) {
  const result = contactMessageSchema.safeParse(input);
  return result.success
    ? undefined
    : toValidationError(result.error).fieldErrors;
}

describe("contactMessageSchema", () => {
  it("trims submitted text and treats a blank reason or booking number as absent", () => {
    expect(
      contactMessageSchema.parse({
        name: " Ahmed ",
        email: " ahmed@example.com ",
        contactReason: "  ",
        bookingNumber: "  ",
        message: " Need help ",
      }),
    ).toEqual({
      name: "Ahmed",
      email: "ahmed@example.com",
      contactReason: undefined,
      bookingNumber: undefined,
      message: "Need help",
    });
  });

  it("keeps a free-text reason", () => {
    expect(
      contactMessageSchema.parse({
        name: "Ahmed",
        email: "ahmed@example.com",
        contactReason: " Order Issue ",
        message: "Need help",
      }).contactReason,
    ).toBe("Order Issue");
  });

  it("returns contact error keys for required and malformed fields", () => {
    expect(
      fieldErrors({
        name: "",
        email: "invalid",
        contactReason: "",
        bookingNumber: "",
        message: "",
      }),
    ).toEqual({
      name: "contact.nameRequired",
      email: "contact.invalidEmail",
      message: "contact.messageRequired",
    });
  });

  it("applies the API's length limits", () => {
    expect(
      fieldErrors({
        name: "a".repeat(256),
        email: "a@example.com",
        contactReason: "r".repeat(256),
        bookingNumber: "x".repeat(256),
        message: "m".repeat(5001),
      }),
    ).toEqual({
      name: "contact.nameTooLong",
      contactReason: "contact.reasonTooLong",
      bookingNumber: "contact.bookingNumberTooLong",
      message: "contact.messageTooLong",
    });
    expect(
      fieldErrors({
        name: "a".repeat(255),
        email: "a@example.com",
        contactReason: "r".repeat(255),
        bookingNumber: "x".repeat(255),
        message: "m".repeat(5000),
      }),
    ).toBeUndefined();
  });
});

describe("joinUsSchema", () => {
  const valid = {
    name: " Acme Owner ",
    phone: { countryCode: "+966", phone: "0512 345 678" },
    companyName: " Acme ",
    email: " owner@example.com ",
    companySizeId: "1",
  };

  function joinErrors(input: unknown) {
    const result = joinUsSchema.safeParse(input);
    return result.success
      ? undefined
      : toValidationError(result.error).fieldErrors;
  }

  it("trims the text and keeps the national number without its leading zero", () => {
    expect(joinUsSchema.parse(valid)).toEqual({
      name: "Acme Owner",
      phone: { countryCode: "+966", phone: "512345678" },
      companyName: "Acme",
      email: "owner@example.com",
      companySizeId: "1",
    });
  });

  it("keeps a non-Saudi number for the API to judge", () => {
    expect(
      joinUsSchema.parse({
        ...valid,
        phone: { countryCode: "+20", phone: "1012345678" },
      }).phone,
    ).toEqual({ countryCode: "+20", phone: "1012345678" });
  });

  it("returns Join Us error keys for required and malformed fields", () => {
    expect(
      joinErrors({
        name: "",
        phone: { countryCode: "+966", phone: "" },
        companyName: "",
        email: "bad",
        companySizeId: "",
      }),
    ).toMatchObject({
      name: "joinUs.nameRequired",
      companyName: "joinUs.companyNameRequired",
      email: "contact.invalidEmail",
      companySizeId: "joinUs.companySizeRequired",
    });
  });

  it("applies the API name limits and a numeric size ID", () => {
    expect(joinErrors({ ...valid, name: "A" })).toEqual({
      name: "joinUs.nameTooShort",
    });
    expect(joinErrors({ ...valid, name: "a".repeat(101) })).toEqual({
      name: "joinUs.nameTooLong",
    });
    expect(joinErrors({ ...valid, companySizeId: "abc" })).toEqual({
      companySizeId: "joinUs.companySizeRequired",
    });
  });
});
