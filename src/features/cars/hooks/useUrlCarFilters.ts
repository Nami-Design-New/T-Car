'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { parseCarFilterDraft, type PriceRange } from '../searchParams';

interface UrlCarFiltersOptions {
  priceRange: PriceRange;
  onClear?: () => void;
}

/** Shared URL-backed search and price state for cars and city car listings. */
export function useUrlCarFilters({ priceRange, onClear }: UrlCarFiltersOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState(priceRange.min);
  const [maxPrice, setMaxPrice] = useState(priceRange.max);

  useEffect(() => {
    const filters = parseCarFilterDraft(
      Object.fromEntries(searchParams.entries()),
      priceRange,
    );
    setSearch(filters.query);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
  }, [priceRange, searchParams]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    });
    router.replace(`${pathname}${next.toString() ? `?${next}` : ''}`, { scroll: false });
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    updateParams({ q: value.trim() || null });
  };

  const handleMinChange = (value: number) => {
    if (Number.isNaN(value)) return;
    const next = Math.min(Math.max(value, priceRange.min), maxPrice - 1);
    setMinPrice(next);
    updateParams({ priceMin: next === priceRange.min ? null : String(next) });
  };

  const handleMaxChange = (value: number) => {
    if (Number.isNaN(value)) return;
    const next = Math.max(Math.min(value, priceRange.max), minPrice + 1);
    setMaxPrice(next);
    updateParams({ priceMax: next === priceRange.max ? null : String(next) });
  };

  const clearUrlFilters = () => {
    setSearch('');
    setMinPrice(priceRange.min);
    setMaxPrice(priceRange.max);
    onClear?.();
    updateParams({ q: null, priceMin: null, priceMax: null, sort: null });
  };

  const clearPriceRange = () => {
    setMinPrice(priceRange.min);
    setMaxPrice(priceRange.max);
    updateParams({ priceMin: null, priceMax: null });
  };

  return {
    search,
    minPrice,
    maxPrice,
    updateSearch,
    handleMinChange,
    handleMaxChange,
    clearPriceRange,
    clearUrlFilters,
  };
}
