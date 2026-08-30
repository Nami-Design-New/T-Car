'use client';

import { ReactNode, useEffect, useState } from 'react';
import { FiSearch, FiSliders, FiX } from 'react-icons/fi';

interface FilterPanelProps {
  title?: string;
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  hasActiveFilters?: boolean;
}

export default function FilterPanel({
  title = 'تصفية النتائج',
  children,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'ابحث عن سيارة أو ماركة...',
  hasActiveFilters = false,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <>
      <div className="filters_mobile_bar">
        <div className="filter_search">
          <FiSearch />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        <button
          type="button"
          className="filters_toggle_btn"
          onClick={() => setIsOpen(true)}
          aria-label="فتح الفلاتر"
        >
          <FiSliders />
          {hasActiveFilters && <span className="filters_toggle_dot" />}
        </button>
      </div>

      {isOpen && <div className="filters_overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`filters_panel${isOpen ? ' is-open' : ''}`}>
        {/* <div className="filter_header">
          <h3>{title}</h3>
          <button
            type="button"
            className="filters_close_btn"
            onClick={() => setIsOpen(false)}
            aria-label="إغلاق الفلاتر"
          >
            <FiX />
          </button>
        </div> */}

        <div className="filter_search filter_search_desktop">
          <FiSearch />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        {children}
      </aside>
    </>
  );
}
