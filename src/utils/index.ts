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

export function classNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
