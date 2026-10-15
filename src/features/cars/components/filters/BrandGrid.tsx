import Image from 'next/image';
import { useTranslations } from 'next-intl';

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
    <div className="filter_group">
      <div className="filter_title">
        <h4>
          {icon}
          {title}
        </h4>
        <button type="button" className="view_all" onClick={() => onSelect(null)}>
          {t('clear')}
        </button>
      </div>
      <div className="brand_list">
        {brands.map((brand, index) => (
          <button
            type="button"
            key={index}
            className={`brand_item ${selected === index ? 'active' : ''}`}
            onClick={() => onSelect(selected === index ? null : index)}
          >
            <span className="brand_logo">
              <Image src={brand.logo} alt={brand.name} width={50} height={50} />
            </span>
            <span className="brand_name">{brand.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
