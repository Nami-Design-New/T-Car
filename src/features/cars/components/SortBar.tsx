'use client';

import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { FiSliders, FiChevronDown } from 'react-icons/fi';

interface Props {
  resultsCount: number;
  value?: string;
}

const SORT_OPTIONS = [
  { value: 'recommended', label: 'الأكثر ملاءمة' },
  { value: 'price_asc', label: 'السعر: من الأقل للأعلى' },
  { value: 'price_desc', label: 'السعر: من الأعلى للأقل' },
  { value: 'rating', label: 'الأعلى تقييمًا' },
];

export default function SortBar({ resultsCount, value = 'recommended' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateSort = (nextSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === 'recommended') params.delete('sort');
    else params.set('sort', nextSort);
    router.replace(`${pathname}${params.toString() ? `?${params}` : ''}`, { scroll: false });
  };

  return (
    <div className="sort-bar">
      <button type="button" className="sort-bar-filter-toggle">
        <FiSliders />
        فلتر
      </button>

      <span className="sort-bar-count">{resultsCount} نتيجة</span>

      <div className="sort-bar-select">
        <select value={value} onChange={(e) => updateSort(e.target.value)}>
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
