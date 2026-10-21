import { describe, expect, it } from 'vitest';
import { toValidationError } from '@/shared/lib/validation';
import { bankAccountSchema } from './validation';

function fieldErrors(input: unknown) {
  const result = bankAccountSchema.safeParse(input);
  return result.success ? undefined : toValidationError(result.error).fieldErrors;
}

describe('bankAccountSchema', () => {
  it('normalizes a Saudi IBAN before returning it', () => {
    expect(
      bankAccountSchema.parse({
        bankId: ' alrajhi ',
        iban: 'sa03 8000 0000 6080 1045 6789',
      })
    ).toEqual({
      bankId: 'alrajhi',
      iban: 'SA0380000000608010456789',
    });
  });

  it('requires a selected bank and a Saudi IBAN with the required syntax and length', () => {
    expect(fieldErrors({ bankId: '', iban: 'GB82WEST12345698765432' })).toEqual({
      bankId: 'bankAccounts.unknownBank',
      iban: 'bankAccounts.invalidIban',
    });
    expect(fieldErrors({ bankId: 'alrajhi', iban: '' })).toEqual({
      iban: 'bankAccounts.ibanRequired',
    });
  });
});
