import Image, { StaticImageData } from 'next/image';

interface Brand {
  name: string;
  logo: StaticImageData;
}

interface BrandGridProps {
  title: string;
  icon?: React.ReactNode;
  brands: Brand[];
  selected: number | null;
  onSelect: (index: number | null) => void;
}

export default function BrandGrid({
  title,
  icon,
  brands,
  selected,
  onSelect,
}: BrandGridProps) {
  return (
    <div className="filter_group">
      <div className="filter_title">
        <h4>
          {icon}
          {title}
        </h4>
        <button type="button" className="view_all" onClick={() => onSelect(null)}>
          مسح
        </button>
      </div>

      <div className="brand_list">
        {brands.map((brand, i) => (
          <button
            type="button"
            key={i}
            className={`brand_item ${selected === i ? 'active' : ''}`}
            onClick={() => onSelect(selected === i ? null : i)}
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