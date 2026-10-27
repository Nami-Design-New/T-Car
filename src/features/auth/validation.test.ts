import { afterEach, describe, expect, it, vi } from 'vitest';
import { toValidationError } from '@/shared/lib/validation';
import { otpCodeSchema, phoneSchema, registerFormSchema, registrationSchema, verifyOtpSchema } from './validation';

describe('registration full-name rules', () => {
  it('accepts a trimmed non-Latin full name', () => {
    expect(
      registerFormSchema.parse({
        fullName: ' أحمد عبدالله ',
        email: 'ahmed@domain.com',
        birthDate: '1990-05-17'
      }).fullName
    ).toBe('أحمد عبدالله');
  });

  it.each([
    ['one character', 'A', 'auth.nameRequired'],
    ['101 characters', 'A'.repeat(101), 'auth.nameRequired'],
    ['digits', 'Ahmed 123', 'auth.nameRequired'],
    ['punctuation', 'Ahmed-Abdullah', 'auth.nameRequired']
  ])('rejects %s', (_, fullName, error) => {
    expect(fieldErrors(registerFormSchema.safeParse({ ...validProfile, fullName }))).toEqual({
      fullName: error
    });
  });
});

const validProfile = {
  fullName: 'Ahmed Abdullah',
  email: 'ahmed@domain.com',
  birthDate: '1990-05-17'
};

/** The `errors.*` key per field, as the Server Action would return it. */
function fieldErrors(result: { success: boolean; error?: Parameters<typeof toValidationError>[0] }) {
  if (result.success || !result.error) return undefined;
  return toValidationError(result.error).fieldErrors;
}

describe('phoneSchema', () => {
  const login = (countryCode: string, phone: string) => ({ phone: { countryCode, phone } });

  it.each(['500000000', '0544444442', '50 000 0000', '500-000-000'])('accepts %s', (phone) => {
    expect(phoneSchema.safeParse(login('+966', phone)).success).toBe(true);
  });

  it('normalizes the national number: digits only, without the trunk 0', () => {
    expect(phoneSchema.parse(login(' +966 ', ' 0544 444-442 '))).toEqual(login('+966', '544444442'));
  });

  it('accepts 8 and 15 national digits, the backend bounds', () => {
    expect(phoneSchema.safeParse(login('+20', '12345678')).success).toBe(true);
    expect(phoneSchema.safeParse(login('+20', '123456789012345')).success).toBe(true);
  });

  it.each([
    ['7 digits', login('+966', '5000000')],
    ['16 digits', login('+966', '5000000000000000')],
    ['7 digits after the trunk 0', login('+966', '05000000')],
    ['letters', login('+966', '50000000a')],
    ['an empty number', login('+966', '')],
    ['a calling code without +', login('966', '500000000')],
    ['an empty calling code', login('', '500000000')],
    ['a string instead of the value', { phone: '+966500000000' }],
  ])('rejects %s on the phone field', (_, input) => {
    expect(fieldErrors(phoneSchema.safeParse(input))).toEqual({
      phone: 'auth.invalidPhone'
    });
  });
});

describe('otpCodeSchema', () => {
  it('accepts exactly four digits', () => {
    expect(otpCodeSchema.safeParse({ code: '1234' }).success).toBe(true);
  });

  it.each(['123', '12345', '12a4', ' 1234', ''])('rejects %j', (code) => {
    expect(fieldErrors(otpCodeSchema.safeParse({ code }))).toEqual({
      code: 'auth.invalidCode'
    });
  });

  it('checks the phone too when verifying', () => {
    expect(
      fieldErrors(verifyOtpSchema.safeParse({ phone: { countryCode: '+966', phone: '12' }, code: '1234' }))
    ).toEqual({
      phone: 'auth.invalidPhone'
    });
  });

  it('verifies the same normalized number the code was sent to', () => {
    expect(
      verifyOtpSchema.parse({ phone: { countryCode: '+966', phone: '0544 444 442' }, code: '1234' })
    ).toEqual({ phone: { countryCode: '+966', phone: '544444442' }, code: '1234' });
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
        email: ' ahmed@domain.com '
      })
    ).toEqual(validProfile);
  });

  it('reports every invalid field with its own key', () => {
    expect(
      fieldErrors(
        registerFormSchema.safeParse({
          fullName: '   ',
          email: '',
          birthDate: ''
        })
      )
    ).toEqual({
      fullName: 'auth.nameRequired',
      email: 'auth.emailRequired',
      birthDate: 'auth.birthDateRequired'
    });
  });

  it('rejects a malformed email', () => {
    expect(fieldErrors(registerFormSchema.safeParse({ ...validProfile, email: 'ahmed@' }))).toEqual({
      email: 'auth.invalidEmail'
    });
  });

  it.each([
    ['an impossible date', '2001-02-30'],
    ['another format', '17/05/1990'],
    ['a date in the future', '2026-10-19']
  ])('rejects %s as a birth date', (_, birthDate) => {
    vi.useFakeTimers({
      now: new Date('2026-10-18T12:00:00Z'),
      toFake: ['Date']
    });
    expect(fieldErrors(registerFormSchema.safeParse({ ...validProfile, birthDate }))).toEqual({
      birthDate: 'auth.invalidBirthDate'
    });
  });

  it('accepts today as a birth date (no minimum age is decided yet)', () => {
    vi.useFakeTimers({
      now: new Date('2026-10-18T12:00:00Z'),
      toFake: ['Date']
    });
    expect(registerFormSchema.safeParse({ ...validProfile, birthDate: '2026-10-18' }).success).toBe(true);
  });

  it('needs the phone and code as well on the server', () => {
    const errors = fieldErrors(registrationSchema.safeParse(validProfile));
    expect(errors).toEqual({
      phone: 'auth.invalidPhone',
      code: 'auth.invalidCode'
    });
  });
});
