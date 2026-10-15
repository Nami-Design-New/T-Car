'use client';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { FiSliders, FiChevronDown } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
interface Props {
  resultsCount: number;
  value?: string;
}
export default function SortBar({ resultsCount, value = 'recommended' }: Props) {
  const t = useTranslations('cars.sort');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const options = [
    { value: 'recommended', label: t('recommended') },
    { value: 'price_asc', label: t('priceAsc') },
    { value: 'price_desc', label: t('priceDesc') },
    { value: 'rating', label: t('rating') },
  ];
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
        {t('filter')}
      </button>
      <span className="sort-bar-count">{t('results', { count: resultsCount })}</span>
      <div className="sort-bar-select">
        <select value={value} onChange={(event) => updateSort(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FiChevronDown className="sort-bar-select-icon" />
      </div>
    </div>
  );
}
