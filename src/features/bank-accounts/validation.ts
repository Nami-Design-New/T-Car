import { z } from 'zod';
import { normalizeIban } from './model';

// Bank-account form rules (doc 9). Bank availability, ownership, duplicates,
// and IBAN checksum verification stay server-defined.
const bankId = z
  .string({ error: 'bankAccounts.unknownBank' })
  .trim()
  .min(1, { error: 'bankAccounts.unknownBank' });

const iban = z
  .string({ error: 'bankAccounts.ibanRequired' })
  .trim()
  .min(1, { error: 'bankAccounts.ibanRequired', abort: true })
  .transform(normalizeIban)
  .pipe(z.string().regex(/^SA\d{2}[A-Z0-9]{20}$/, { error: 'bankAccounts.invalidIban' }));

/** A normalized Saudi IBAN has the SA prefix, two check digits, and 20 BBAN characters. */
export const bankAccountSchema = z.object({ bankId, iban });

export type BankAccountFormValues = z.infer<typeof bankAccountSchema>;