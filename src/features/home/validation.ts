import { z } from "zod";

const REASONS = [
  "booking",
  "car-rental",
  "payment",
  "partnership",
  "other",
] as const;

const requiredText = (message: string) =>
  z.string({ error: message }).trim().min(1, { error: message });

const optionalBookingNumber = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .max(50, { error: "contact.bookingNumberTooLong" })
    .optional(),
);

const contactReason = z
  .string({ error: "contact.reasonRequired" })
  .trim()
  .min(1, { error: "contact.reasonRequired" })
  .pipe(z.enum(REASONS, { error: "contact.invalidReason" }));

export const contactMessageSchema = z.object({
  name: requiredText("contact.nameRequired"),
  email: requiredText("contact.emailRequired").pipe(
    z.email({ error: "contact.invalidEmail" }),
  ),
  contactReason,
  bookingNumber: optionalBookingNumber,
  message: requiredText("contact.messageRequired"),
});

export type ContactMessageFormValues = z.input<typeof contactMessageSchema>;
export type ContactMessageValues = z.output<typeof contactMessageSchema>;
