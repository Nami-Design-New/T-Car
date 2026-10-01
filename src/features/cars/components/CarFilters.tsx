'use client';
import { FiShield, FiTruck, FiX } from 'react-icons/fi';
import { TbCar, TbCar4Wd, TbCaravan, TbCarOffRoad, TbCarSuv, TbTruck } from 'react-icons/tb';
import Image from 'next/image';
import nissanLogo from '@/assets/icons/nissan.svg';
import { useTranslations } from 'next-intl';
import FilterPanel from './filters/FilterPanel';
import PriceRangeSlider from './filters/PriceRangeSlider';
import CheckboxGroup from './filters/CheckboxGroup';
import { useToggleList } from '@/shared/hooks/useToggleList';
import { PRICE_MAX, PRICE_MIN, useUrlCarFilters } from '../hooks/useUrlCarFilters';
const COMPANIES = ['elite', 'elite', 'elite', 'elite', 'elite'];
const SERVICES = ['delivery', 'delivery', 'delivery', 'delivery'];
const BRANDS = ['nissan-1', 'nissan-2', 'nissan-3', 'nissan-4'];
const CAR_TYPES = [
  { id: 'family', key: 'family', icon: TbCarSuv },
  { id: 'convertible', key: 'convertible', icon: TbCar },
  { id: 'hatchback', key: 'hatchback', icon: TbCar4Wd },
  { id: 'sedan', key: 'sedan', icon: TbCarOffRoad },
  { id: 'pickup', key: 'pickup', icon: TbTruck },
  { id: 'van', key: 'van', icon: TbCaravan },
];
export default function CarFilters() {
  const t = useTranslations('cars');
  const companies = useToggleList();
  const types = useToggleList();
  const services = useToggleList();
  const brands = useToggleList();
  const {
    search,
    minPrice,
    maxPrice,
    updateSearch,
    handleMinChange,
    handleMaxChange,
    clearPriceRange,
    clearUrlFilters,
  } = useUrlCarFilters({
    onClear: () => {
      companies.clear();
      types.clear();
      services.clear();
      brands.clear();
    },
  });
  const active =
    search.trim() !== '' ||
    minPrice !== PRICE_MIN ||
    maxPrice !== PRICE_MAX ||
    companies.selected.length > 0 ||
    types.selected.length > 0 ||
    services.selected.length > 0 ||
    brands.selected.length > 0;
  return (
    <FilterPanel
      searchValue={search}
      onSearchChange={updateSearch}
      hasActiveFilters={active}
      onClearAll={clearUrlFilters}
    >
      <section className="filter_group chip_filter_group">
        <div className="filter_title">
          <h4>{t('filters.brand')}</h4>
          <button
            type="button"
            className="view_all"
            onClick={brands.clear}
            disabled={!brands.selected.length}
          >
            {t('filters.clear')}
          </button>
        </div>
        <div className="filter_chip_list">
          {BRANDS.map((id) => {
            const selected = brands.selected.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={`filter_chip brand_filter_chip${selected ? ' is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => brands.toggle(id)}
              >
                <span className="filter_chip_visual brand_chip_logo">
                  <Image src={nissanLogo} alt="" width={24} height={24} />
                </span>
                <span className="filter_chip_label">{t('brands.nissan')}</span>
                {selected && (
                  <span className="filter_chip_remove" aria-hidden="true">
                    <FiX />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
      <section className="filter_group chip_filter_group">
        <div className="filter_title">
          <h4>{t('filters.type')}</h4>
          <button
            type="button"
            className="view_all"
            onClick={types.clear}
            disabled={!types.selected.length}
          >
            {t('filters.clear')}
          </button>
        </div>
        <div className="filter_chip_list car_type_chip_list">
          {CAR_TYPES.map(({ id, key, icon: Icon }) => {
            const selected = types.selected.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={`filter_chip car_type_filter_chip${selected ? ' is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => types.toggle(id)}
              >
                <span className="filter_chip_visual car_type_icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="filter_chip_label">{t(`types.${key}`)}</span>
                {selected && (
                  <span className="filter_chip_remove" aria-hidden="true">
                    <FiX />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
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
    </FilterPanel>
  );
}
