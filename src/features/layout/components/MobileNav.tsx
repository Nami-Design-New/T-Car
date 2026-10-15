'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { FiMenu, FiX } from 'react-icons/fi';

interface Props {
  children: ReactNode;
}

export default function MobileNav({ children }: Props) {
  const t = useTranslations('layout.mobileNav');
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <nav
        className={`header-nav ${isOpen ? 'is-open' : ''}`}
        onClick={handleNavClick}
      >
        {children}
      </nav>

      <button
        type="button"
        className="header-toggle"
        aria-label={t('toggle')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>
    </>
  );
}
