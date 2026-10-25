'use client';

import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { FiGlobe, FiCheck, FiChevronDown } from 'react-icons/fi';
import { SUPPORTED_LANGUAGES } from '@/shared/config/languages';
import { Menu } from '@/shared/ui/Menu';
import { cn } from '@/shared/lib/cn';

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
    <div className="lang-switcher relative min-w-[62px]">
      <Menu.Root>
        <Menu.Trigger asChild>
          <button type="button" className="lang-switcher-trigger flex h-11 w-full items-center justify-center gap-1.5 rounded-md border border-stroke-light bg-surface-background px-2.5 text-sm font-semibold text-text-primary transition hover:border-action-primary">
            <FiGlobe className="lang-switcher-icon shrink-0 text-lg" aria-hidden="true" />
            <span className="lang-switcher-code text-xs font-extrabold tracking-[0.04em]">{current.code.toUpperCase()}</span>
            <FiChevronDown className="lang-switcher-chevron shrink-0 text-[13px]" aria-hidden="true" />
          </button>
        </Menu.Trigger>

        <Menu.Content className="lang-switcher-list min-w-[120px]" align="end">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Menu.Item
              key={lang.code}
              className={cn(
                'justify-between',
                lang.code === locale && 'text-action-primary data-[highlighted]:bg-surface-card-primary',
              )}
              onSelect={() => handleSelect(lang.code)}
            >
              <span>{lang.label}</span>
              {lang.code === locale && <FiCheck className="check_icon text-action-primary" aria-hidden="true" />}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Root>
    </div>
  );
}
