import {SUPPORTED_LANGUAGES} from '@constants/index';

export type Direction = 'ltr' | 'rtl';

export function getDirection(locale: string): Direction {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.code === locale)?.dir ?? 'ltr'
  );
}

export function formatCurrency(
  value: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Plain number for amounts shown next to the SAR icon, e.g. 2500 → "2,500". */
export function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

/** e.g. "1 ديسمبر 2025 - 4:50 AM" */
export function formatTransactionDate(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat('ar', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
  }).format(date);
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(
    date
  );

  return `${day} - ${time}`;
}

export function classNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
