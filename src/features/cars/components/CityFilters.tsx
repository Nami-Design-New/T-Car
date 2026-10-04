'use client';
import { useState } from 'react';
import { FiTruck, FiGrid, FiShield } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import FilterPanel from './filters/FilterPanel';
import PriceRangeSlider from './filters/PriceRangeSlider';
import CheckboxGroup from './filters/CheckboxGroup';
import BrandGrid from './filters/BrandGrid';
import { useToggleList } from '@/shared/hooks/useToggleList';
import { PRICE_MAX, PRICE_MIN, useUrlCarFilters } from '../hooks/useUrlCarFilters';
import type { CarBrand } from '../model';
const COMPANIES = ['elite', 'elite', 'elite', 'elite', 'elite'];
const TYPES = ['economy', 'sedan', 'suv', 'luxury'];
const SERVICES = ['delivery', 'delivery', 'delivery', 'delivery'];

interface Props {
  brands: CarBrand[];
}

export default function CitiesFilters({ brands }: Props) {
  const t = useTranslations('cars');
  const companies = useToggleList();
  const types = useToggleList();
  const services = useToggleList();
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const {
    search,
    minPrice,
    maxPrice,
    updateSearch,
    handleMinChange,
    handleMaxChange,
    clearPriceRange,
  } = useUrlCarFilters();
  const active =
    search.trim() !== '' ||
    minPrice !== PRICE_MIN ||
    maxPrice !== PRICE_MAX ||
    companies.selected.length > 0 ||
    types.selected.length > 0 ||
    services.selected.length > 0 ||
    selectedBrand !== null;
  return (
    <FilterPanel searchValue={search} onSearchChange={updateSearch} hasActiveFilters={active}>
      <PriceRangeSlider
        min={PRICE_MIN}
        max={PRICE_MAX}
        minValue={minPrice}
        maxValue={maxPrice}
        onMinChange={handleMinChange}
        onMaxChange={handleMaxChange}
        onClear={clearPriceRange}
      />
      <CheckboxGroup
        icon={<FiTruck />}
        title={t('filters.companies')}
        items={COMPANIES}
        getLabel={() => t('companies.elite')}
        selected={companies.selected}
        onToggle={companies.toggle}
        onClear={companies.clear}
        visibleCount={3}
      />
      <CheckboxGroup
        icon={<FiGrid />}
        title={t('filters.type')}
        items={TYPES}
        getLabel={(item) => t(`cityTypes.${item}`)}
        selected={types.selected}
        onToggle={types.toggle}
        onClear={types.clear}
      />
      <CheckboxGroup
        icon={<FiShield />}
        title={t('filters.services')}
        items={SERVICES}
        selected={services.selected}
        onToggle={services.toggle}
        onClear={services.clear}
        visibleCount={2}
        itemClassName="check_item service_item"
        renderExtra={() => (
          <div>
            <span className="service_title">{t('services.delivery.title')}</span>
            <span className="service_desc">{t('services.delivery.description')}</span>
          </div>
        )}
      />
      <BrandGrid
        icon={<FiTruck />}
        title={t('filters.brand')}
        brands={brands.map(({ slug, logo }) => ({ logo, name: t(`brands.${slug}`) }))}
        selected={selectedBrand}
        onSelect={setSelectedBrand}
      />
    </FilterPanel>
  );
}
