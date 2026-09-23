'use client';

import {useState, useRef, useEffect} from 'react';
import {useLocale} from 'next-intl';
import {useRouter, usePathname} from 'next/navigation';
import {FiGlobe, FiCheck} from 'react-icons/fi';
import {SUPPORTED_LANGUAGES} from '@constants/index';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === locale) ??
    SUPPORTED_LANGUAGES[0];

  const handleSelect = (code: string) => {
    setOpen(false);

    const segments = pathname.split('/');

    // Replace current locale in URL
    if (SUPPORTED_LANGUAGES.some((lang) => lang.code === segments[1])) {
      segments[1] = code;
    } else {
      segments.splice(1, 0, code);
    }

    router.push(segments.join('/'));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        type="button"
        className="lang-switcher-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <FiGlobe
          className="lang-switcher-icon"
          aria-hidden="true"
        />

        <span>{current.label}</span>
      </button>

      {open && (
        <ul
          className="lang-switcher-list"
          role="listbox"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <li
              key={lang.code}
              role="option"
              aria-selected={lang.code === locale}
              className={
                lang.code === locale ? 'active' : ''
              }
              onClick={() => handleSelect(lang.code)}
            >
              <span>{lang.label}</span>

              {lang.code === locale && (
                <FiCheck className="check_icon" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}