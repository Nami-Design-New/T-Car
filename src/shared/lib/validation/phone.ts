import { z } from "zod";
import { NATIONAL_NUMBER_DIGITS, toNationalNumber } from "../phone";

/** Validates the calling code and normalizes the national number. */
export const phoneValueSchema = z
  .object(
    {
      countryCode: z.string({ error: "auth.invalidPhone" }).trim(),
      phone: z.string({ error: "auth.invalidPhone" }).trim(),
    },
    { error: "auth.invalidPhone" },
  )
  .refine(
    ({ countryCode, phone }) =>
      /^\+\d{1,4}$/.test(countryCode) && /^[\d\s-]+$/.test(phone),
    { error: "auth.invalidPhone", abort: true },
  )
  .refine(
    ({ phone }) => toNationalNumber(phone).length >= NATIONAL_NUMBER_DIGITS.min,
    {
      error: "auth.phoneTooShort",
      abort: true,
    },
  )
  .refine(
    ({ phone }) => toNationalNumber(phone).length <= NATIONAL_NUMBER_DIGITS.max,
    {
      error: "auth.phoneTooLong",
    },
  )
  .transform(({ countryCode, phone }) => ({
    countryCode,
    phone: toNationalNumber(phone),
  }));
