'use client';

import { useState } from 'react';
import { FiSliders, FiChevronDown } from 'react-icons/fi';

interface Props {
  resultsCount: number;
}

const SORT_OPTIONS = [
  { value: 'recommended', label: 'الأكثر ملاءمة' },
  { value: 'price_asc', label: 'السعر: من الأقل للأعلى' },
  { value: 'price_desc', label: 'السعر: من الأعلى للأقل' },
  { value: 'rating', label: 'الأعلى تقييمًا' },
];

export default function SortBar({ resultsCount }: Props) {
  const [sort, setSort] = useState('recommended');

  return (
    <div className="sort-bar">
      <button type="button" className="sort-bar-filter-toggle">
        <FiSliders />
        فلتر
      </button>

      <span className="sort-bar-count">{resultsCount} نتيجة</span>

      <div className="sort-bar-select">
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <FiChevronDown className="sort-bar-select-icon" />
      </div>
    </div>
  );
}