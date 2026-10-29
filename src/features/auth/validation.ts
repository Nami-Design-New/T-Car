import { z } from 'zod';
import { profileFieldsSchema } from '@/shared/lib/validation/profile';
import { NATIONAL_NUMBER_DIGITS, toNationalNumber } from './model';

// Auth form schemas (doc 9). Messages are `errors.*` keys, never user text.
// The client resolves forms with them and the Server Actions parse them again.
/** Length of the one-time code the backend sends. */
export const OTP_LENGTH = 4;

const CALLING_CODE = /^\+\d{1,4}$/;

/**
 * The login phone as `PhoneField` holds it: calling code and national number
 * kept apart, as the API takes them. Errors stay on `phone`, and the parsed
 * value carries the normalized national number.
 */
const phoneValue = z
  .object(
    {
      countryCode: z.string({ error: 'auth.invalidPhone' }).trim(),
      phone: z.string({ error: 'auth.invalidPhone' }).trim(),
    },
    { error: 'auth.invalidPhone' }
  )
  .refine(({ countryCode, phone }) => CALLING_CODE.test(countryCode) && /^[\d\s-]+$/.test(phone), {
    error: 'auth.invalidPhone',
    abort: true,
  })
  .refine(({ phone }) => toNationalNumber(phone).length >= NATIONAL_NUMBER_DIGITS.min, {
    error: 'auth.phoneTooShort',
    abort: true,
  })
  .refine(({ phone }) => toNationalNumber(phone).length <= NATIONAL_NUMBER_DIGITS.max, {
    error: 'auth.phoneTooLong',
  })
  .transform(({ countryCode, phone }) => ({ countryCode, phone: toNationalNumber(phone) }));

const code = z
  .string({ error: 'auth.invalidCode' })
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), { error: 'auth.invalidCode' });

/** Login step: the phone the code is sent to. */
export const phoneSchema = z.object({ phone: phoneValue });

/** OTP step: the code the customer typed. */
export const otpCodeSchema = z.object({ code });

/** What `verifyOtpAction` receives: the phone the code was sent to, and the code. */
export const verifyOtpSchema = z.object({ phone: phoneValue, code });

/** Registration step: the profile fields (consent is implied by continuing). */
export const registerFormSchema = profileFieldsSchema;

const invalidLocation = { error: 'auth.invalidLocation' } as const;

/**
 * Location step: what `MapLocationModal` picked, as `/assign-location` takes it.
 * The backend requires a region; when the geocoder has none, the address is sent.
 */
export const locationSchema = z
  .object(
    {
      lat: z.number(invalidLocation).min(-90, invalidLocation).max(90, invalidLocation),
      lng: z.number(invalidLocation).min(-180, invalidLocation).max(180, invalidLocation),
      address: z.string(invalidLocation).trim().min(1, invalidLocation),
      region: z.string(invalidLocation).trim().optional(),
    },
    invalidLocation
  )
  .transform(({ lat, lng, address, region }) => ({
    latitude: lat,
    longitude: lng,
    addressName: address,
    region: region || address,
  }));

export type PhoneFormInput = z.input<typeof phoneSchema>;
export type PhoneFormValues = z.output<typeof phoneSchema>;
export type OtpCodeValues = z.infer<typeof otpCodeSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
