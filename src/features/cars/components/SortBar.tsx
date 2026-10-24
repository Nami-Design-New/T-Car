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
    <div className="sort-bar mb-6 flex items-center gap-4">
      <button type="button" className="sort-bar-filter-toggle hidden items-center gap-1.5 rounded-md border border-stroke-light bg-surface-elevated px-3.5 py-2 text-sm font-semibold text-text-primary lg:hidden">
        <FiSliders />
        {t('filter')}
      </button>
      <span className="sort-bar-count me-auto text-sm text-text-subtle">{t('results', { count: resultsCount })}</span>
      <div className="sort-bar-select relative">
        <select className="appearance-none rounded-md border border-stroke-light bg-surface-elevated py-2 pe-[34px] ps-3.5 text-sm font-semibold text-text-primary" value={value} onChange={(event) => updateSort(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FiChevronDown className="sort-bar-select-icon pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-subtle" />
      </div>
    </div>
  );
}
