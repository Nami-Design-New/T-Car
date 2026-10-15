import { FiDollarSign } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
interface PriceRangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  onClear: () => void;
}
export default function PriceRangeSlider({
  min,
  max,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  onClear,
}: PriceRangeSliderProps) {
  const t = useTranslations('cars.filters');
  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;
  return (
    <div className="filter_group">
      <div className="filter_title">
        <h4>
          <FiDollarSign />
          {t('priceRange')}
        </h4>
        <button type="button" className="view_all" onClick={onClear}>
          {t('clear')}
        </button>
      </div>
      <div className="range_slider">
        <div className="range_track">
          <div
            className="range_fill"
            style={{ insetInlineStart: `${minPercent}%`, insetInlineEnd: `${100 - maxPercent}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          onChange={(event) => onMinChange(Number(event.target.value))}
          className="thumb thumb_min"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          onChange={(event) => onMaxChange(Number(event.target.value))}
          className="thumb thumb_max"
        />
      </div>
      <div className="price_inputs">
        <div className="price_box">
          <FiDollarSign />
          <div>
            <span className="price_label">{t('minimum')}</span>
            <input
              type="number"
              value={minValue}
              min={min}
              max={max}
              onChange={(event) => onMinChange(Number(event.target.value))}
            />
          </div>
        </div>
        <div className="price_box">
          <FiDollarSign />
          <div>
            <span className="price_label">{t('maximum')}</span>
            <input
              type="number"
              value={maxValue}
              min={min}
              max={max}
              onChange={(event) => onMaxChange(Number(event.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
