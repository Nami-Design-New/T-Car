import { z } from "zod";
import { isPhoneNumber } from "@/shared/lib/validation";
import { profileFieldsSchema } from "@/shared/lib/validation/profile";
import { phoneValueSchema } from "@/shared/lib/validation/phone";

import {
  LICENSE_MAX_SIZE_BYTES,
  isLicenseFileType,
  type LicenseUpload,
} from "./model";

// Account form schemas (doc 9). Messages are `errors.*` keys, never user text.
// The client resolves forms with them and the Server Actions parse them again.

/** Length of the code sent to a new phone number. */
export const PHONE_CODE_LENGTH = 4;

const phone = z
  .string({ error: "account.invalidPhone" })
  .trim()
  .refine(isPhoneNumber, { error: "account.invalidPhone" });

const code = z
  .string({ error: "account.invalidCode" })
  .regex(new RegExp(`^\\d{${PHONE_CODE_LENGTH}}$`), {
    error: "account.invalidCode",
  });

/**
 * The fields the customer edits on the profile page. The phone and license
 * status are server-managed: they change only through their own flows.
 */
export const profileFormSchema = profileFieldsSchema;

/** Change-phone step: the new number the code is sent to. */
export const phoneChangeSchema = z.object({ phone: phoneValueSchema });

/** The legacy edit modal still uses a combined phone string. */
export const legacyPhoneChangeSchema = z.object({ phone });

/** Verify step, in the dialog: the code the customer typed. */
export const phoneCodeSchema = z.object({ code });

/** What `verifyPhoneAction` receives. */
export const verifyPhoneSchema = z.object({ phone, code });

/** The selected license image. The action parses this same schema from FormData. */
const licenseFile = z
  .custom<LicenseUpload>(
    (value): value is LicenseUpload =>
      typeof value === "object" &&
      value !== null &&
      typeof (value as LicenseUpload).name === "string" &&
      typeof (value as LicenseUpload).size === "number" &&
      typeof (value as LicenseUpload).type === "string",
    { error: "account.licenseRequired" },
  )
  .refine((file) => file.name.trim().length > 0, {
    error: "account.licenseRequired",
  })
  .refine((file) => Number.isFinite(file.size) && file.size >= 0, {
    error: "account.licenseRequired",
  })
  .refine((file) => file.size <= LICENSE_MAX_SIZE_BYTES, {
    error: "account.licenseTooLarge",
  })
  .refine((file) => isLicenseFileType(file.type), {
    error: "account.licenseInvalidType",
  });

export const licenseUploadSchema = z.object({ file: licenseFile });
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type PhoneChangeValues = z.infer<typeof phoneChangeSchema>;
export type LegacyPhoneChangeValues = z.infer<typeof legacyPhoneChangeSchema>;
export type PhoneCodeValues = z.infer<typeof phoneCodeSchema>;
export type LicenseUploadValues = z.infer<typeof licenseUploadSchema>;
