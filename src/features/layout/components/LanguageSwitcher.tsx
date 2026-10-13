'use client';

import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { FiGlobe, FiCheck, FiChevronDown } from 'react-icons/fi';
import { SUPPORTED_LANGUAGES } from '@/shared/config/languages';
import { Menu } from '@/shared/ui/Menu';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const current =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === locale) ?? SUPPORTED_LANGUAGES[0];

  const handleSelect = (code: string) => {
    if (code === locale) return;

    const segments = pathname.split('/');

    // Replace current locale in URL
    if (SUPPORTED_LANGUAGES.some((lang) => lang.code === segments[1])) {
      segments[1] = code;
    } else {
      segments.splice(1, 0, code);
    }

    // A full navigation rather than router.push. The Google Maps script is
    // injected once per page session and cannot be re-requested with a
    // different language, so a client-side switch would leave the map stuck
    // in the previous language. Reloading is what lets it load the new one.
    // Query string and hash are carried over; usePathname() omits both.
    window.location.assign(segments.join('/') + window.location.search + window.location.hash);
  };

  return (
    <div className="lang-switcher">
      <Menu.Root>
        <Menu.Trigger asChild>
          <button type="button" className="lang-switcher-trigger">
            <FiGlobe className="lang-switcher-icon" aria-hidden="true" />
            <span className="lang-switcher-code">{current.code.toUpperCase()}</span>
            <FiChevronDown className="lang-switcher-chevron" aria-hidden="true" />
          </button>
        </Menu.Trigger>

        <Menu.Content className="lang-switcher-list" align="end">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Menu.Item
              key={lang.code}
              className={lang.code === locale ? 'active' : ''}
              onSelect={() => handleSelect(lang.code)}
            >
              <span>{lang.label}</span>
              {lang.code === locale && <FiCheck className="check_icon" aria-hidden="true" />}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Root>
    </div>
  );
}
