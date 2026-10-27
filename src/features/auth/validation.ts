import { z } from 'zod';
import {
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  isFullName,
  isPastIsoDate,
} from '@/shared/lib/validation';
import { isNationalNumber, toNationalNumber } from './model';

// Auth form schemas (doc 9). Messages are `errors.*` keys, never user text.
// The client resolves forms with them and the Server Actions parse them again.
/** Length of the one-time code the backend sends. */
export const OTP_LENGTH = 4;

const CALLING_CODE = /^\+\d{1,4}$/;

/**
 * The login phone as `PhoneField` holds it: calling code and national number
 * kept apart, as the API takes them. One message on `phone` for any problem;
 * the parsed value carries the normalized national number.
 */
const phoneValue = z
  .object(
    {
      countryCode: z.string({ error: 'auth.invalidPhone' }).trim(),
      phone: z.string({ error: 'auth.invalidPhone' }).trim(),
    },
    { error: 'auth.invalidPhone' }
  )
  .refine(({ countryCode, phone }) => CALLING_CODE.test(countryCode) && isNationalNumber(phone), {
    error: 'auth.invalidPhone',
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
const registerName = z
  .string({ error: 'auth.nameRequired' })
  .trim()
  .min(1, { error: 'auth.nameRequired', abort: true })
  .min(FULL_NAME_MIN_LENGTH, { error: 'auth.nameRequired', abort: true })
  .max(FULL_NAME_MAX_LENGTH, { error: 'auth.nameRequired', abort: true })
  .refine(isFullName, { error: 'auth.nameRequired' });

export const registerFormSchema = z.object({
  fullName: registerName,
  email: z
    .string({ error: 'auth.emailRequired' })
    .trim()
    .min(1, { error: 'auth.emailRequired', abort: true })
    .pipe(z.email({ error: 'auth.invalidEmail' })),
  birthDate: z
    .string({ error: 'auth.birthDateRequired' })
    .min(1, { error: 'auth.birthDateRequired', abort: true })
    .refine(isPastIsoDate, { error: 'auth.invalidBirthDate' })
});

/** What `registerAction` receives: the verified phone and code plus the form. */
export const registrationSchema = verifyOtpSchema.extend(registerFormSchema.shape);

export type PhoneFormInput = z.input<typeof phoneSchema>;
export type PhoneFormValues = z.output<typeof phoneSchema>;
export type OtpCodeValues = z.infer<typeof otpCodeSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type RegistrationSubmission = z.input<typeof registrationSchema>;
