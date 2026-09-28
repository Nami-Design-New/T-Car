import type { StaticImageData } from 'next/image';

export interface Bank {
  id: string;
  name: string;
  logo?: StaticImageData | string;
}

export interface BankAccount {
  id: string;
  bankId: string;
  bankName: string;
  logo?: StaticImageData | string;
  iban: string;
  maskedNumber: string;
}

/** What the add / edit bank account form submits. */
export interface BankAccountPayload {
  bankId: string;
  iban: string;
}

/** Upper-cases the IBAN and drops any spaces the user typed. */
export const normalizeIban = (iban: string) => iban.replace(/\s+/g, '').toUpperCase();

/** Last six IBAN characters in pairs, e.g. "…456789" → "45 67 89". */
export const maskIban = (iban: string) =>
  normalizeIban(iban)
    .slice(-6)
    .match(/.{1,2}/g)
    ?.join(' ') ?? '';
