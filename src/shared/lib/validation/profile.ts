import { z } from "zod";
import {
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  isFullName,
  isOldEnough,
  isPastIsoDate,
} from "./common";

/** Shared registration and profile-edit rules; messages are errors.* keys. */
export const profileFieldsSchema = z.object({
  fullName: z
    .string({ error: "auth.nameRequired" })
    .trim()
    .min(1, { error: "auth.nameRequired", abort: true })
    .min(FULL_NAME_MIN_LENGTH, { error: "auth.nameTooShort", abort: true })
    .max(FULL_NAME_MAX_LENGTH, { error: "auth.nameTooLong", abort: true })
    .refine(isFullName, { error: "auth.nameRequired" }),
  email: z
    .string({ error: "auth.emailRequired" })
    .trim()
    .min(1, { error: "auth.emailRequired", abort: true })
    .pipe(z.email({ error: "auth.invalidEmail" })),
  birthDate: z
    .string({ error: "auth.birthDateRequired" })
    .min(1, { error: "auth.birthDateRequired", abort: true })
    .refine(isPastIsoDate, { error: "auth.invalidBirthDate", abort: true })
    .refine((value) => isOldEnough(value), { error: "auth.underAge" }),
});
