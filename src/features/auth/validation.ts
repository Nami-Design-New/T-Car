import { z } from 'zod';

// Auth form schemas (doc 9). Messages are `errors.*` keys, never user text.
// The client resolves forms with them and the Server Actions parse them again.

/** Length of the one-time code the backend sends. */
export const OTP_LENGTH = 4;

/**
 * Digits a phone number may have, country code included: 9 is the current mock
 * minimum, 15 is the E.164 maximum. Supported countries and the stored format
 * are not decided yet (doc 9 §9.4), so the number is checked, not rewritten.
 */
const PHONE_DIGITS = { min: 9, max: 15 };

function isPhoneNumber(value: string) {
  if (!/^\+?[\d\s()-]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, '').length;
  return digits >= PHONE_DIGITS.min && digits <= PHONE_DIGITS.max;
}

/** A real `YYYY-MM-DD` calendar date that is not in the future. */
function isPastIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  // Rejects dates such as 2001-02-30, which Date rolls over into March.
  return date.toISOString().startsWith(value) && date.getTime() <= Date.now();
}

const phone = z
  .string({ error: 'auth.invalidPhone' })
  .trim()
  .refine(isPhoneNumber, { error: 'auth.invalidPhone' });

const code = z
  .string({ error: 'auth.invalidCode' })
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), { error: 'auth.invalidCode' });

/** Login step: the phone the code is sent to. */
export const phoneSchema = z.object({ phone });

/** OTP step: the code the customer typed. */
export const otpCodeSchema = z.object({ code });

/** What `verifyOtpAction` receives. */
export const verifyOtpSchema = z.object({ phone, code });

/** Registration step: the profile fields and the terms checkbox. */
export const registerFormSchema = z.object({
  fullName: z
    .string({ error: 'auth.nameRequired' })
    .trim()
    .min(1, { error: 'auth.nameRequired' }),
  email: z
    .string({ error: 'auth.emailRequired' })
    .trim()
    .min(1, { error: 'auth.emailRequired', abort: true })
    .pipe(z.email({ error: 'auth.invalidEmail' })),
  birthDate: z
    .string({ error: 'auth.birthDateRequired' })
    .min(1, { error: 'auth.birthDateRequired', abort: true })
    .refine(isPastIsoDate, { error: 'auth.invalidBirthDate' }),
  // A boolean, not `literal(true)`, so the unchecked box is a valid form value.
  acceptTerms: z
    .boolean({ error: 'auth.termsRequired' })
    .refine((value) => value, { error: 'auth.termsRequired' }),
});

/** What `registerAction` receives: the verified phone and code plus the form. */
export const registrationSchema = verifyOtpSchema.extend(registerFormSchema.shape);

export type PhoneFormValues = z.infer<typeof phoneSchema>;
export type OtpCodeValues = z.infer<typeof otpCodeSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type RegistrationSubmission = z.input<typeof registrationSchema>;
