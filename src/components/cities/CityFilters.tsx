'use client';

import { useState } from 'react';

import {
  FiDollarSign,
  FiStar,
  FiTruck,
  FiGrid,
  FiShield,
} from 'react-icons/fi';

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
  'إيسوزو',
  'جيلي',
  'تويوتا',
  'هونداي',
];

const TYPES = [
  'مشاهدة الكل',
  'سيارة عائلية',
  'سيارة اقتصادية',
  'سيدان',
  'سيارة فارهة',
];

const SERVICES = [
  'تحديد الكل',
  'خدمة التوصيل و الإرجاع',
  'خدمة شوفير',
  'كيلومترات غير محدودة',
  'تأمين شامل',
];

export default function CityFilters() {
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
    <aside className="city_filters">

      <div className="filter_header">

        <h3>تصفية النتائج</h3>

      </div>

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

            <span>التقييم {item}</span>

          </label>

        ))}

      </div>

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

      <div className="filter_group">

        <h4>

          <FiShield />

          الخدمات المتوفرة

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