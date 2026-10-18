import { afterEach, describe, expect, it, vi } from 'vitest';
import { toValidationError } from '@/shared/lib/validation';
import {
  phoneChangeSchema,
  phoneCodeSchema,
  profileFormSchema,
  verifyPhoneSchema,
} from './validation';

const validProfile = {
  fullName: 'Ahmed Abdullah',
  email: 'ahmed@domain.com',
  birthDate: '1993-03-15',
};

/** The `errors.*` key per field, as the Server Action would return it. */
function fieldErrors(result: {
  success: boolean;
  error?: Parameters<typeof toValidationError>[0];
}) {
  if (result.success || !result.error) return undefined;
  return toValidationError(result.error).fieldErrors;
}

describe('profileFormSchema', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts the editable fields and trims the text', () => {
    expect(
      profileFormSchema.parse({
        fullName: ' Ahmed Abdullah  ',
        email: ' ahmed@domain.com',
        birthDate: '1993-03-15',
      })
    ).toEqual(validProfile);
  });

  it('drops server-managed fields the client sends', () => {
    expect(
      profileFormSchema.parse({ ...validProfile, phone: '+966500000000', licenseUploaded: true })
    ).toEqual(validProfile);
  });

  it('reports every invalid field with an account key', () => {
    expect(
      fieldErrors(profileFormSchema.safeParse({ fullName: ' ', email: '', birthDate: '' }))
    ).toEqual({
      fullName: 'account.nameRequired',
      email: 'account.emailRequired',
      birthDate: 'account.birthDateRequired',
    });
  });

  it('rejects a malformed email and a future birth date', () => {
    vi.useFakeTimers({ now: new Date('2026-10-18T12:00:00Z'), toFake: ['Date'] });
    expect(
      fieldErrors(
        profileFormSchema.safeParse({ ...validProfile, email: 'a@', birthDate: '2027-01-01' })
      )
    ).toEqual({ email: 'account.invalidEmail', birthDate: 'account.invalidBirthDate' });
  });
});

describe('phone schemas', () => {
  it('checks the new phone number', () => {
    expect(phoneChangeSchema.safeParse({ phone: '966511111111' }).success).toBe(true);
    expect(fieldErrors(phoneChangeSchema.safeParse({ phone: '+966' }))).toEqual({
      phone: 'account.invalidPhone',
    });
  });

  it('needs exactly four code digits', () => {
    expect(phoneCodeSchema.safeParse({ code: '1234' }).success).toBe(true);
    expect(fieldErrors(phoneCodeSchema.safeParse({ code: '12' }))).toEqual({
      code: 'account.invalidCode',
    });
  });

  it('checks both when verifying', () => {
    expect(fieldErrors(verifyPhoneSchema.safeParse({ phone: '1', code: 'abcd' }))).toEqual({
      phone: 'account.invalidPhone',
      code: 'account.invalidCode',
    });
  });
});
