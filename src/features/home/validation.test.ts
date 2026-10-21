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
  it("trims submitted text and treats an empty booking number as absent", () => {
    expect(
      contactMessageSchema.parse({
        name: " Ahmed ",
        email: " ahmed@example.com ",
        contactReason: " booking ",
        bookingNumber: "  ",
        message: " Need help ",
      }),
    ).toEqual({
      name: "Ahmed",
      email: "ahmed@example.com",
      contactReason: "booking",
      bookingNumber: undefined,
      message: "Need help",
    });
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
      contactReason: "contact.reasonRequired",
      message: "contact.messageRequired",
    });
    expect(
      fieldErrors({
        name: "A",
        email: "a@example.com",
        contactReason: "unsupported",
        bookingNumber: "x".repeat(51),
        message: "Hello",
      }),
    ).toEqual({
      contactReason: "contact.invalidReason",
      bookingNumber: "contact.bookingNumberTooLong",
    });
  });
});
