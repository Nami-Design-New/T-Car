import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';

interface Brand {
  name: string;
  logo: string;
}
interface BrandGridProps {
  title: string;
  icon?: React.ReactNode;
  brands: Brand[];
  selected: number | null;
  onSelect: (index: number | null) => void;
}

export default function BrandGrid({ title, icon, brands, selected, onSelect }: BrandGridProps) {
  const t = useTranslations('cars.filters');
  return (
    <div className="filter_group mb-7 border-b border-stroke-light pb-7 last:mb-0 last:border-0 last:pb-0">
      <div className="filter_title mb-[18px] flex items-center justify-between">
        <h4 className="m-0 flex items-center gap-2 text-[15px] font-bold text-text-primary [&>svg]:text-action-primary">
          {icon}
          {title}
        </h4>
        <button type="button" className="view_all border-0 bg-transparent text-[13px] font-semibold text-action-primary" onClick={() => onSelect(null)}>
          {t('clear')}
        </button>
      </div>
      <div className="brand_list grid grid-cols-2 gap-2.5">
        {brands.map((brand, index) => (
          <button
            type="button"
            key={index}
            className={cn(
              'brand_item relative flex w-full items-center gap-2.5 rounded-md border border-stroke-light bg-surface-on-background px-3 py-2 text-end transition duration-200 hover:border-action-primary/30',
              selected === index && 'active !border-action-primary !bg-action-primary [&_.brand_name]:font-bold [&_.brand_name]:!text-text-on-action',
            )}
            onClick={() => onSelect(selected === index ? null : index)}
          >
            <span className="brand_logo relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-stroke-light bg-surface-elevated">
              <Image src={brand.logo} alt={brand.name} width={50} height={50} className="size-5 object-contain" />
            </span>
            <span className="brand_name overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-text-subtle">{brand.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
