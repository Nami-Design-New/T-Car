import { describe, expect, it } from "vitest";
import { toValidationError } from "@/shared/lib/validation";
import { contactMessageSchema } from "./validation";

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
