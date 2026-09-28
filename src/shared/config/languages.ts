export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
] as const;

export type Direction = 'ltr' | 'rtl';

export function getDirection(locale: string): Direction {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === locale)?.dir ?? 'ltr';
}
