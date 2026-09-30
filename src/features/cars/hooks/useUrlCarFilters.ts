'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';

export const PRICE_MIN = 100;
export const PRICE_MAX = 30000;

interface UrlCarFiltersOptions {
  onClear?: () => void;
}

/** Shared URL-backed search and price state for cars and city car listings. */
export function useUrlCarFilters({ onClear }: UrlCarFiltersOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);

  useEffect(() => {
    setSearch(searchParams.get('q') ?? '');
    setMinPrice(Number(searchParams.get('priceMin')) || PRICE_MIN);
    setMaxPrice(Number(searchParams.get('priceMax')) || PRICE_MAX);
  }, [searchParams]);

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
    const next = Math.min(Math.max(value, PRICE_MIN), maxPrice - 1);
    setMinPrice(next);
    updateParams({ priceMin: next === PRICE_MIN ? null : String(next) });
  };

  const handleMaxChange = (value: number) => {
    if (Number.isNaN(value)) return;
    const next = Math.max(Math.min(value, PRICE_MAX), minPrice + 1);
    setMaxPrice(next);
    updateParams({ priceMax: next === PRICE_MAX ? null : String(next) });
  };

  const clearUrlFilters = () => {
    setSearch('');
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    onClear?.();
    updateParams({ q: null, priceMin: null, priceMax: null, sort: null });
  };

  const clearPriceRange = () => {
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
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
