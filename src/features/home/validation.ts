import { z } from "zod";
import { phoneValueSchema } from "@/shared/lib/validation/phone";

// Contact form rules, with POST /contact-us's limits
// (docs/api/contact-join-us-api.md §4.1).

const requiredText = (required: string, max: number, tooLong: string) =>
  z
    .string({ error: required })
    .trim()
    .min(1, { error: required })
    .max(max, { error: tooLong });

/** Optional free text: blank is treated as absent. */
const optionalText = (max: number, tooLong: string) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(max, { error: tooLong }).optional(),
  );

export const contactMessageSchema = z.object({
  name: requiredText("contact.nameRequired", 255, "contact.nameTooLong"),
  email: z
    .string({ error: "contact.emailRequired" })
    .trim()
    .min(1, { error: "contact.emailRequired" })
    .pipe(z.email({ error: "contact.invalidEmail" })),
  /** Free text (product decision Q2), sent as `reason`. */
  contactReason: optionalText(255, "contact.reasonTooLong"),
  /** Sent as `order_number`. */
  bookingNumber: optionalText(255, "contact.bookingNumberTooLong"),
  message: requiredText(
    "contact.messageRequired",
    5000,
    "contact.messageTooLong",
  ),
});

export type ContactMessageFormValues = z.input<typeof contactMessageSchema>;
export type ContactMessageValues = z.output<typeof contactMessageSchema>;

// Join Us rules, with POST /join-us's limits (docs/api/contact-join-us-api.md
// §4.2). The phone keeps every country (Q4): the API's Saudi rule answers a
// non-Saudi number with its own 422.
export const joinUsSchema = z.object({
  name: z
    .string({ error: "joinUs.nameRequired" })
    .trim()
    .min(1, { error: "joinUs.nameRequired", abort: true })
    .min(2, { error: "joinUs.nameTooShort" })
    .max(100, { error: "joinUs.nameTooLong" }),
  phone: phoneValueSchema,
  companyName: requiredText(
    "joinUs.companyNameRequired",
    255,
    "joinUs.companyNameTooLong",
  ),
  email: z
    .string({ error: "contact.emailRequired" })
    .trim()
    .min(1, { error: "contact.emailRequired" })
    .pipe(z.email({ error: "contact.invalidEmail" })),
  /** An `id` from GET /settings → company_sizes. */
  companySizeId: z
    .string({ error: "joinUs.companySizeRequired" })
    .regex(/^[1-9]\d*$/, { error: "joinUs.companySizeRequired" }),
});

export type JoinUsFormValues = z.input<typeof joinUsSchema>;
export type JoinUsValues = z.output<typeof joinUsSchema>;

