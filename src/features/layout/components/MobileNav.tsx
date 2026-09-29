'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

interface Props {
  children: ReactNode;
}

export default function MobileNav({ children }: Props) {
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
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>
    </>
  );
}
