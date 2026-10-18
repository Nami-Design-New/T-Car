import { z } from 'zod';
import { isPastIsoDate, isPhoneNumber } from '@/shared/lib/validation';

// Account form schemas (doc 9). Messages are `errors.*` keys, never user text.
// The client resolves forms with them and the Server Actions parse them again.

/** Length of the code sent to a new phone number. */
export const PHONE_CODE_LENGTH = 4;

const phone = z
  .string({ error: 'account.invalidPhone' })
  .trim()
  .refine(isPhoneNumber, { error: 'account.invalidPhone' });

const code = z
  .string({ error: 'account.invalidCode' })
  .regex(new RegExp(`^\\d{${PHONE_CODE_LENGTH}}$`), { error: 'account.invalidCode' });

/**
 * The fields the customer edits on the profile page. The phone and license
 * status are server-managed: they change only through their own flows.
 */
export const profileFormSchema = z.object({
  fullName: z
    .string({ error: 'account.nameRequired' })
    .trim()
    .min(1, { error: 'account.nameRequired' }),
  email: z
    .string({ error: 'account.emailRequired' })
    .trim()
    .min(1, { error: 'account.emailRequired', abort: true })
    .pipe(z.email({ error: 'account.invalidEmail' })),
  birthDate: z
    .string({ error: 'account.birthDateRequired' })
    .min(1, { error: 'account.birthDateRequired', abort: true })
    .refine(isPastIsoDate, { error: 'account.invalidBirthDate' }),
});

/** Change-phone step: the new number the code is sent to. */
export const phoneChangeSchema = z.object({ phone });

/** Verify step, in the dialog: the code the customer typed. */
export const phoneCodeSchema = z.object({ code });

/** What `verifyPhoneAction` receives. */
export const verifyPhoneSchema = z.object({ phone, code });

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type PhoneChangeValues = z.infer<typeof phoneChangeSchema>;
export type PhoneCodeValues = z.infer<typeof phoneCodeSchema>;
