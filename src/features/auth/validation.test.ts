import { afterEach, describe, expect, it, vi } from 'vitest';
import { toValidationError } from '@/shared/lib/validation';
import {
  otpCodeSchema,
  phoneSchema,
  registerFormSchema,
  registrationSchema,
  verifyOtpSchema,
} from './validation';

const validProfile = {
  fullName: 'Ahmed Abdullah',
  email: 'ahmed@domain.com',
  birthDate: '1990-05-17',
  acceptTerms: true,
};

/** The `errors.*` key per field, as the Server Action would return it. */
function fieldErrors(result: {
  success: boolean;
  error?: Parameters<typeof toValidationError>[0];
}) {
  if (result.success || !result.error) return undefined;
  return toValidationError(result.error).fieldErrors;
}

describe('phoneSchema', () => {
  it.each(['966500000000', '+966500000000', '+966 50 000 0000', ' +1 (415) 555-0100 '])(
    'accepts %s',
    (phone) => {
      expect(phoneSchema.safeParse({ phone }).success).toBe(true);
    }
  );

  it('trims the phone and keeps its format otherwise', () => {
    expect(phoneSchema.parse({ phone: ' +966 500000000 ' })).toEqual({ phone: '+966 500000000' });
  });

  it.each([
    ['only the country code', '+966'],
    ['8 digits', '96650000'],
    ['16 digits', '+9665000000000000'],
    ['letters', '+96650000000a'],
    ['empty', ''],
  ])('rejects %s', (_, phone) => {
    expect(fieldErrors(phoneSchema.safeParse({ phone }))).toEqual({ phone: 'auth.invalidPhone' });
  });

  it('accepts 9 and 15 digits, the bounds', () => {
    expect(phoneSchema.safeParse({ phone: '966500000' }).success).toBe(true);
    expect(phoneSchema.safeParse({ phone: '966500000000000' }).success).toBe(true);
  });

  it('rejects a value that is not a string with the same key', () => {
    expect(fieldErrors(phoneSchema.safeParse({ phone: 966500000000 }))).toEqual({
      phone: 'auth.invalidPhone',
    });
  });
});

describe('otpCodeSchema', () => {
  it('accepts exactly four digits', () => {
    expect(otpCodeSchema.safeParse({ code: '1234' }).success).toBe(true);
  });

  it.each(['123', '12345', '12a4', ' 1234', ''])('rejects %j', (code) => {
    expect(fieldErrors(otpCodeSchema.safeParse({ code }))).toEqual({ code: 'auth.invalidCode' });
  });

  it('checks the phone too when verifying', () => {
    expect(fieldErrors(verifyOtpSchema.safeParse({ phone: '+966', code: '1234' }))).toEqual({
      phone: 'auth.invalidPhone',
    });
  });
});

describe('registerFormSchema', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a complete profile and trims the text fields', () => {
    expect(
      registerFormSchema.parse({
        ...validProfile,
        fullName: '  Ahmed Abdullah ',
        email: ' ahmed@domain.com ',
      })
    ).toEqual(validProfile);
  });

  it('reports every invalid field with its own key', () => {
    expect(
      fieldErrors(
        registerFormSchema.safeParse({
          fullName: '   ',
          email: '',
          birthDate: '',
          acceptTerms: false,
        })
      )
    ).toEqual({
      fullName: 'auth.nameRequired',
      email: 'auth.emailRequired',
      birthDate: 'auth.birthDateRequired',
      acceptTerms: 'auth.termsRequired',
    });
  });

  it('rejects a malformed email', () => {
    expect(
      fieldErrors(registerFormSchema.safeParse({ ...validProfile, email: 'ahmed@' }))
    ).toEqual({ email: 'auth.invalidEmail' });
  });

  it.each([
    ['an impossible date', '2001-02-30'],
    ['another format', '17/05/1990'],
    ['a date in the future', '2026-10-19'],
  ])('rejects %s as a birth date', (_, birthDate) => {
    vi.useFakeTimers({ now: new Date('2026-10-18T12:00:00Z'), toFake: ['Date'] });
    expect(fieldErrors(registerFormSchema.safeParse({ ...validProfile, birthDate }))).toEqual({
      birthDate: 'auth.invalidBirthDate',
    });
  });

  it('accepts today as a birth date (no minimum age is decided yet)', () => {
    vi.useFakeTimers({ now: new Date('2026-10-18T12:00:00Z'), toFake: ['Date'] });
    expect(
      registerFormSchema.safeParse({ ...validProfile, birthDate: '2026-10-18' }).success
    ).toBe(true);
  });

  it('needs the phone and code as well on the server', () => {
    const errors = fieldErrors(registrationSchema.safeParse(validProfile));
    expect(errors).toEqual({ phone: 'auth.invalidPhone', code: 'auth.invalidCode' });
  });
});
