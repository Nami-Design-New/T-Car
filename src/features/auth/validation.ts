import { z } from 'zod';
import {
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  isFullName,
  isPastIsoDate,
  isPhoneNumber,
} from '@/shared/lib/validation';

// Auth form schemas (doc 9). Messages are `errors.*` keys, never user text.
// The client resolves forms with them and the Server Actions parse them again.
/** Length of the one-time code the backend sends. */
export const OTP_LENGTH = 4;

const phone = z.string({ error: 'auth.invalidPhone' }).trim().refine(isPhoneNumber, { error: 'auth.invalidPhone' });

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
    .refine(isPastIsoDate, { error: 'auth.invalidBirthDate' }),
  // A boolean, not `literal(true)`, so the unchecked box is a valid form value.
  acceptTerms: z.boolean({ error: 'auth.termsRequired' }).refine((value) => value, { error: 'auth.termsRequired' })
});

/** What `registerAction` receives: the verified phone and code plus the form. */
export const registrationSchema = verifyOtpSchema.extend(registerFormSchema.shape);

export type PhoneFormValues = z.infer<typeof phoneSchema>;
export type OtpCodeValues = z.infer<typeof otpCodeSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type RegistrationSubmission = z.input<typeof registrationSchema>;
