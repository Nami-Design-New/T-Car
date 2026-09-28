'use client';

import { ReactNode, useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

function FilterFunnelIcon() {
  return (
    <svg width="22" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.75v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.72a2.25 2.25 0 0 1-.659-1.591V2.34a.75.75 0 0 1 .628-.74Z"
        fill="currentColor"
      />
      <rect x="23" y="3" width="9" height="2" rx="1" fill="currentColor" />
      <rect x="23" y="9" width="9" height="2" rx="1" fill="currentColor" />
      <rect x="23" y="15" width="9" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

interface FilterPanelProps {
  title?: string;
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  hasActiveFilters?: boolean;
  applyLabel?: string;
  clearAllLabel?: string;
  onApply?: () => void;
  onClearAll?: () => void;
}

export default function FilterPanel({
  title = 'تصفية النتائج',
  children,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'ابحث عن سيارة أو ماركة...',
  hasActiveFilters = false,
  applyLabel = 'بحث',
  clearAllLabel = 'مسح الكل',
  onApply,
  onClearAll,
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
          <FilterFunnelIcon />
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

        {(onApply || onClearAll) && (
          <div className="filter_actions">
            <button
              type="button"
              className="filter_action_btn filter_clear_all_btn"
              onClick={onClearAll}
              disabled={!hasActiveFilters}
            >
              {clearAllLabel}
            </button>
            <button
              type="button"
              className="filter_action_btn filter_apply_btn"
              onClick={() => {
                onApply?.();
                setIsOpen(false);
              }}
            >
              {applyLabel}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
