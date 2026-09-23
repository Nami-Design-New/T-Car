'use client';

import { useState } from 'react';
import { FiShield, FiTruck, FiX } from 'react-icons/fi';
import { TbCar, TbCar4Wd, TbCaravan, TbCarOffRoad, TbCarSuv, TbTruck } from 'react-icons/tb';
import nissanLogo from '@/assets/icons/nissan.svg';
import Image from 'next/image';

import FilterPanel from '@/components/filters/FilterPanel';
import PriceRangeSlider from '@/components/filters/PriceRangeSlider';
import CheckboxGroup from '@/components/filters/CheckboxGroup';
import { useToggleList } from '@/hooks/useToggleList';

const COMPANIES = ['معرض النخبة', 'معرض النخبة', 'معرض النخبة', 'معرض النخبة', 'معرض النخبة'];

const CAR_TYPES = [
  { id: 'family', label: 'عائلية', icon: TbCarSuv },
  { id: 'convertible', label: 'كشف', icon: TbCar },
  { id: 'hatchback', label: 'هاتشباك', icon: TbCar4Wd },
  { id: 'sedan', label: 'سيدان', icon: TbCarOffRoad },
  { id: 'pickup', label: 'حوض', icon: TbTruck },
  { id: 'van', label: 'فان', icon: TbCaravan },
];

const SERVICES = [
  { title: 'خدمة توصيل السيارات', desc: 'يتم توصيل السيارة عند باب منزلك' },
  { title: 'خدمة توصيل السيارات', desc: 'يتم توصيل السيارة عند باب منزلك' },
  { title: 'خدمة توصيل السيارات', desc: 'يتم توصيل السيارة عند باب منزلك' },
  { title: 'خدمة توصيل السيارات', desc: 'يتم توصيل السيارة عند باب منزلك' },
];

const BRANDS = [
  { id: 'nissan-1', name: 'نيسان', logo: nissanLogo },
  { id: 'nissan-2', name: 'نيسان', logo: nissanLogo },
  { id: 'nissan-3', name: 'نيسان', logo: nissanLogo },
  { id: 'nissan-4', name: 'نيسان', logo: nissanLogo },
];

const PRICE_MIN = 100;
const PRICE_MAX = 30000;

export default function CarFilters() {
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);

  const companies = useToggleList();
  const types = useToggleList();
  const services = useToggleList();
  const brands = useToggleList();

  const handleMinChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setMinPrice(Math.min(Math.max(value, PRICE_MIN), maxPrice - 1));
  };
  const handleMaxChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setMaxPrice(Math.max(Math.min(value, PRICE_MAX), minPrice + 1));
  };

  const handleClearAll = () => {
    setSearch('');
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    companies.clear();
    types.clear();
    services.clear();
    brands.clear();
  };

  const hasActiveFilters =
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
      onSearchChange={setSearch}
      hasActiveFilters={hasActiveFilters}
      onClearAll={handleClearAll}
    >
      <section className="filter_group chip_filter_group" aria-labelledby="brand-filter-title">
        <div className="filter_title">
          <h4 id="brand-filter-title">العلامة التجارية</h4>
          <button
            type="button"
            className="view_all"
            onClick={brands.clear}
            disabled={brands.selected.length === 0}
          >
            مسح
          </button>
        </div>

        <div className="filter_chip_list">
          {BRANDS.map((brand) => {
            const isSelected = brands.selected.includes(brand.id);

            return (
              <button
                type="button"
                key={brand.id}
                className={`filter_chip brand_filter_chip${isSelected ? ' is-selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => brands.toggle(brand.id)}
              >
                <span className="filter_chip_visual brand_chip_logo" aria-hidden="true">
                  <Image src={brand.logo} alt="" width={24} height={24} />
                </span>
                <span className="filter_chip_label">{brand.name}</span>
                {isSelected && (
                  <span className="filter_chip_remove" aria-hidden="true">
                    <FiX />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="filter_group chip_filter_group" aria-labelledby="car-type-filter-title">
        <div className="filter_title">
          <h4 id="car-type-filter-title">نوع السيارة</h4>
          <button
            type="button"
            className="view_all"
            onClick={types.clear}
            disabled={types.selected.length === 0}
          >
            مسح
          </button>
        </div>

        <div className="filter_chip_list car_type_chip_list">
          {CAR_TYPES.map((type) => {
            const isSelected = types.selected.includes(type.id);
            const TypeIcon = type.icon;

            return (
              <button
                type="button"
                key={type.id}
                className={`filter_chip car_type_filter_chip${isSelected ? ' is-selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => types.toggle(type.id)}
              >
                <span className="filter_chip_visual car_type_icon" aria-hidden="true">
                  <TypeIcon />
                </span>
                <span className="filter_chip_label">{type.label}</span>
                {isSelected && (
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
        onClear={() => {
          setMinPrice(PRICE_MIN);
          setMaxPrice(PRICE_MAX);
        }}
      />

      <CheckboxGroup
        icon={<FiTruck />}
        title="الشركات"
        items={COMPANIES}
        selected={companies.selected}
        onToggle={companies.toggle}
        onClear={companies.clear}
        visibleCount={3}
      />

      <CheckboxGroup
        icon={<FiShield />}
        title="خدمات إضافية"
        items={SERVICES.map((s) => s.title)}
        selected={services.selected}
        onToggle={services.toggle}
        onClear={services.clear}
        visibleCount={2}
        itemClassName="check_item service_item"
        renderExtra={(item) => {
          const service = SERVICES.find((s) => s.title === item);
          return (
            <div>
              <span className="service_title">{item}</span>
              <span className="service_desc">{service?.desc}</span>
            </div>
          );
        }}
      />
    </FilterPanel>
  );
}
