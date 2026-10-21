import { afterEach, describe, expect, it, vi } from 'vitest';
import { isFullName, isPastIsoDate, isPhoneNumber } from './validation';

describe('isFullName', () => {
  it.each(['Ahmed Abdullah', 'أحمد عبدالله', '李小龍', 'Élodie Martin'])('accepts %s', (value) => {
    expect(isFullName(value)).toBe(true);
  });

  it.each(['', 'A1', 'Ahmed-Abdullah', 'Ahmed_Abdullah', ' Ahmed Abdullah'])('rejects %j', (value) => {
    expect(isFullName(value)).toBe(false);
  });
});

describe('isPhoneNumber', () => {
  it.each(['966500000', '+966500000000', '+966 50 000 0000', '+1 (415) 555-0100'])('accepts %s', (value) => {
    expect(isPhoneNumber(value)).toBe(true);
  });

  it.each(['+966', '96650000', '+9665000000000000', '96650000000a', ''])('rejects %j', (value) => {
    expect(isPhoneNumber(value)).toBe(false);
  });
});

describe('isPastIsoDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a real date up to today', () => {
    vi.useFakeTimers({
      now: new Date('2026-10-18T12:00:00Z'),
      toFake: ['Date']
    });
    expect(isPastIsoDate('1990-05-17')).toBe(true);
    expect(isPastIsoDate('2026-10-18')).toBe(true);
  });

  it.each(['2026-10-19', '2001-02-30', '17/05/1990', '1990-5-17', ''])('rejects %j', (value) => {
    vi.useFakeTimers({
      now: new Date('2026-10-18T12:00:00Z'),
      toFake: ['Date']
    });
    expect(isPastIsoDate(value)).toBe(false);
  });
});
