'use client';

import { ReactNode, useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useTranslations } from 'next-intl';

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

function FilterFunnelIcon() {
  return <span aria-hidden="true">≡</span>;
}

export default function FilterPanel({
  title,
  children,
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  hasActiveFilters = false,
  applyLabel,
  clearAllLabel,
  onApply,
  onClearAll,
}: FilterPanelProps) {
  const t = useTranslations('cars.filters');
  const [isOpen, setIsOpen] = useState(false);
  const resolvedTitle = title ?? t('title');
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('searchPlaceholder');
  const resolvedApplyLabel = applyLabel ?? t('apply');
  const resolvedClearAllLabel = clearAllLabel ?? t('clearAll');

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => event.key === 'Escape' && setIsOpen(false);
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
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={resolvedSearchPlaceholder}
          />
        </div>
        <button
          type="button"
          className="filters_toggle_btn"
          onClick={() => setIsOpen(true)}
          aria-label={t('open')}
        >
          <FilterFunnelIcon />
          {hasActiveFilters && <span className="filters_toggle_dot" />}
        </button>
      </div>
      {isOpen && <div className="filters_overlay" onClick={() => setIsOpen(false)} />}
      <aside className={`filters_panel${isOpen ? ' is-open' : ''}`}>
        <div className="filter_header">
          <h3>{resolvedTitle}</h3>
          <button
            type="button"
            className="filters_close_btn"
            onClick={() => setIsOpen(false)}
            aria-label={t('close')}
          >
            <FiX />
          </button>
        </div>
        <div className="filter_search filter_search_desktop">
          <FiSearch />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={resolvedSearchPlaceholder}
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
              {resolvedClearAllLabel}
            </button>
            <button
              type="button"
              className="filter_action_btn filter_apply_btn"
              onClick={() => {
                onApply?.();
                setIsOpen(false);
              }}
            >
              {resolvedApplyLabel}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
