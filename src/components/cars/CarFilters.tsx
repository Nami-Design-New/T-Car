'use client';

import { useState } from 'react';
import {
  FiMapPin,
  FiSearch,
  FiDollarSign,
  FiStar,
  FiTruck,
  FiGrid,
  FiShield,
} from 'react-icons/fi';

const LOCATIONS = [
  'مشاهدة الكل',
  'الرياض',
  'جدة',
  'مكة المكرمة',
  'بيشة',
];

const PRICE_RANGES = [
  'أصغر من 100 ريال',
  '100 إلى 250 ريال',
  '250 إلى 500 ريال',
  '500 إلى 1000 ريال',
  'أكبر من 1000 ريال',
];

const RATINGS = [5, 4, 3, 2, 1];

const BRANDS = [
  'مشاهدة الكل',
  'تويوتا',
  'هيونداي',
  'كيا',
  'نيسان',
];

const TYPES = [
  'مشاهدة الكل',
  'اقتصادية',
  'سيدان',
  'SUV',
  'فاخرة',
];

const SERVICES = [
  'تحديد الكل',
  'خدمة التوصيل',
  'شوفير',
  'كيلومترات مفتوحة',
  'تأمين شامل',
];

export default function CarFilters() {
  const [location, setLocation] = useState('مشاهدة الكل');
  const [search, setSearch] = useState('');

  const [price, setPrice] = useState(PRICE_RANGES[0]);
  const [rating, setRating] = useState(5);

  const [brands, setBrands] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);

  const toggle = (
    value: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) =>
      prev.includes(value)
        ? prev.filter((i) => i !== value)
        : [...prev, value]
    );
  };

  return (
    <aside className="car_filters">

      <div className="filter_header">
        <h3>تصفية النتائج</h3>
      </div>

      {/* الموقع */}

      <div className="filter_group">

        <div className="filter_title">
          <h4>
            <FiMapPin />
            الموقع
          </h4>

          <button
            type="button"
            className="view_all"
            onClick={() => setLocation('مشاهدة الكل')}
          >
            مشاهدة الكل
          </button>
        </div>

        <div className="location_search">
          <FiSearch />

          <input
            type="text"
            placeholder="بحث"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {LOCATIONS.filter((item) => item.includes(search)).map((item) => (
          <label key={item} className="radio_item">
            <input
              type="radio"
              checked={location === item}
              onChange={() => setLocation(item)}
            />
            <span>{item}</span>
          </label>
        ))}

      </div>

      {/* السعر */}

      <div className="filter_group">
        <h4>
          <FiDollarSign />
          السعر
        </h4>

        {PRICE_RANGES.map((item) => (
          <label key={item} className="radio_item">
            <input
              type="radio"
              checked={price === item}
              onChange={() => setPrice(item)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>

      {/* التقييم */}

      <div className="filter_group">
        <h4>
          <FiStar />
          التقييم
        </h4>

        {RATINGS.map((item) => (
          <label key={item} className="radio_item">
            <input
              type="radio"
              checked={rating === item}
              onChange={() => setRating(item)}
            />
            <span>{item} نجوم</span>
          </label>
        ))}
      </div>

      {/* الماركة */}

      <div className="filter_group">
        <h4>
          <FiTruck />
          ماركة السيارة
        </h4>

        {BRANDS.map((item) => (
          <label key={item} className="check_item">
            <input
              type="checkbox"
              checked={brands.includes(item)}
              onChange={() => toggle(item, brands, setBrands)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>

      {/* النوع */}

      <div className="filter_group">
        <h4>
          <FiGrid />
          نوع السيارة
        </h4>

        {TYPES.map((item) => (
          <label key={item} className="check_item">
            <input
              type="checkbox"
              checked={types.includes(item)}
              onChange={() => toggle(item, types, setTypes)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>

      {/* الخدمات */}

      <div className="filter_group">
        <h4>
          <FiShield />
          الخدمات
        </h4>

        {SERVICES.map((item) => (
          <label key={item} className="check_item">
            <input
              type="checkbox"
              checked={services.includes(item)}
              onChange={() => toggle(item, services, setServices)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>

    </aside>
  );
}