export const SITE_NAME = 'T-Car';


export const NAV_LINKS = [
  {
    href: '/',
    label: 'nav.home',
  },
{   

  href: '/#partners',
  label: 'nav.partners',
},
  {
    href: '/#why-choose-us',
    label: 'nav.whyChooseUs',
  },
  {
    href: '/#faqs',
    label: 'nav.faqs',
  },
  {
    href: '/#contact',
    label: 'nav.contact',
  },
];
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
] as const;

export const DEFAULT_LANGUAGE = 'ar';
