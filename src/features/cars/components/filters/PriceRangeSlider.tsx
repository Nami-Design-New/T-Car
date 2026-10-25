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
    <div className="filter_group mb-7 border-b border-stroke-light pb-7 last:mb-0 last:border-0 last:pb-0">
      <div className="filter_title mb-[18px] flex items-center justify-between">
        <h4 className="m-0 flex items-center gap-2 text-[15px] font-bold text-text-primary [&>svg]:text-action-primary">
          <FiDollarSign className="text-action-primary" />
          {t('priceRange')}
        </h4>
        <button type="button" className="view_all border-0 bg-transparent text-[13px] font-semibold text-action-primary" onClick={onClear}>
          {t('clear')}
        </button>
      </div>
      <div className="range_slider relative mb-4 h-6">
        <div className="range_track absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-xs bg-stroke-light">
          <div
            className="range_fill absolute inset-y-0 bg-action-primary"
            style={{ insetInlineStart: `${minPercent}%`, insetInlineEnd: `${100 - maxPercent}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          onChange={(event) => onMinChange(Number(event.target.value))}
          className="thumb thumb_min pointer-events-none absolute inset-x-0 top-1/2 m-0 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-action-primary [&::-moz-range-thumb]:bg-surface-elevated [&::-moz-range-thumb]:shadow-[0_2px_6px_rgba(30,30,30,0.2)] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-action-primary [&::-webkit-slider-thumb]:bg-surface-elevated [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(30,30,30,0.2)]"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          onChange={(event) => onMaxChange(Number(event.target.value))}
          className="thumb thumb_max pointer-events-none absolute inset-x-0 top-1/2 m-0 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-action-primary [&::-moz-range-thumb]:bg-surface-elevated [&::-moz-range-thumb]:shadow-[0_2px_6px_rgba(30,30,30,0.2)] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-action-primary [&::-webkit-slider-thumb]:bg-surface-elevated [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(30,30,30,0.2)]"
        />
      </div>
      <div className="price_inputs flex gap-3">
        <div className="price_box flex flex-1 items-center gap-2.5 rounded-md border border-stroke-light bg-surface-on-background px-3 py-2.5">
          <FiDollarSign className="shrink-0 text-lg text-action-primary" />
          <div>
            <span className="price_label text-[11px] font-medium text-text-placeholder">{t('minimum')}</span>
            <input
              type="number"
              value={minValue}
              min={min}
              max={max}
              onChange={(event) => onMinChange(Number(event.target.value))}
              className="w-full border-0 bg-transparent p-0 text-sm font-bold text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>
        <div className="price_box flex flex-1 items-center gap-2.5 rounded-md border border-stroke-light bg-surface-on-background px-3 py-2.5">
          <FiDollarSign className="shrink-0 text-lg text-action-primary" />
          <div>
            <span className="price_label text-[11px] font-medium text-text-placeholder">{t('maximum')}</span>
            <input
              type="number"
              value={maxValue}
              min={min}
              max={max}
              onChange={(event) => onMaxChange(Number(event.target.value))}
              className="w-full border-0 bg-transparent p-0 text-sm font-bold text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
