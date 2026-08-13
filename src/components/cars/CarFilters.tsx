'use client';

import { useState } from 'react';
import { FiTruck, FiGrid, FiShield } from 'react-icons/fi';
import nissanLogo from '@/assets/icons/nissan.svg';

import FilterPanel from '@/components/filters/FilterPanel';
import PriceRangeSlider from '@/components/filters/PriceRangeSlider';
import CheckboxGroup from '@/components/filters/CheckboxGroup';
import BrandGrid from '@/components/filters/BrandGrid';
import { useToggleList } from '@/hooks/useToggleList';

const COMPANIES = ['معرض النخبة', 'معرض النخبة', 'معرض النخبة', 'معرض النخبة', 'معرض النخبة'];
const TYPES = ['اقتصادية', 'سيدان', 'SUV', 'فاخرة'];

const SERVICES = [
  { title: 'خدمة توصيل السيارات', desc: 'يتم توصيل السيارة عند باب منزلك' },
  { title: 'خدمة توصيل السيارات', desc: 'يتم توصيل السيارة عند باب منزلك' },
  { title: 'خدمة توصيل السيارات', desc: 'يتم توصيل السيارة عند باب منزلك' },
  { title: 'خدمة توصيل السيارات', desc: 'يتم توصيل السيارة عند باب منزلك' },
];

const BRANDS = [
  { name: 'نيسان', logo: nissanLogo },
  { name: 'نيسان', logo: nissanLogo },
  { name: 'نيسان', logo: nissanLogo },
  { name: 'نيسان', logo: nissanLogo },
];

const PRICE_MIN = 100;
const PRICE_MAX = 30000;

export default function CarFilters() {
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);

  const companies = useToggleList();
  const types = useToggleList();
  const services = useToggleList();
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);

  const handleMinChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setMinPrice(Math.min(Math.max(value, PRICE_MIN), maxPrice - 1));
  };
  const handleMaxChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setMaxPrice(Math.max(Math.min(value, PRICE_MAX), minPrice + 1));
  };

  return (
    <FilterPanel>
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
        icon={<FiGrid />}
        title="نوع السيارة"
        items={TYPES}
        selected={types.selected}
        onToggle={types.toggle}
        onClear={types.clear}
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

      <BrandGrid
        icon={<FiTruck />}
        title="العلامة التجارية"
        brands={BRANDS}
        selected={selectedBrand}
        onSelect={setSelectedBrand}
      />
    </FilterPanel>
  );
}