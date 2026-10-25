'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { FiMenu, FiX } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';

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
        className={cn(
          'header-nav flex flex-1 items-center justify-between gap-8 max-lg:fixed max-lg:inset-inline-start-0 max-lg:top-20 max-lg:h-0 max-lg:w-full max-lg:flex-col max-lg:items-start max-lg:overflow-hidden max-lg:bg-surface-background max-lg:px-8 max-lg:shadow-[0_8px_24px_rgba(30,30,30,0.1)] max-lg:transition-[height,padding] max-lg:duration-[350ms]',
          isOpen && 'is-open max-lg:h-auto max-lg:gap-0 max-lg:overflow-y-auto max-lg:p-8',
        )}
        onClick={handleNavClick}
      >
        {children}
      </nav>

      <button
        type="button"
        className="header-toggle hidden size-[42px] place-items-center rounded-md border border-stroke-light bg-surface-background text-text-primary transition hover:bg-brand hover:text-text-on-brand max-lg:grid"
        aria-label={t('toggle')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>
    </>
  );
}
