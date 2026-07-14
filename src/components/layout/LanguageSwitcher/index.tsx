'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe, FiCheck } from 'react-icons/fi';
import { SUPPORTED_LANGUAGES } from '@constants/index';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        <FiGlobe className="lang-switcher-icon" aria-hidden="true" />
        <span>{current.label}</span>
      </button>

      {open && (
        <ul className="lang-switcher-list" role="listbox">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <li
              key={lang.code}
              role="option"
              aria-selected={lang.code === i18n.language}
              className={lang.code === i18n.language ? 'active' : ''}
              onClick={() => handleSelect(lang.code)}
            >
              <span>{lang.label}</span>
              {lang.code === i18n.language && <FiCheck className="check_icon" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}