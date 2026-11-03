import { useTranslations } from "next-intl";
import { Price } from "@/shared/ui/Price";
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
  const t = useTranslations("cars.filters");
  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;
  return (
    <div className="filter_group border-stroke-light mb-7 border-b pb-7 last:mb-0 last:border-0 last:pb-0">
      <div className="filter_title mb-4.5 flex items-center justify-between">
        <h4 className="text-text-primary [&>svg]:text-action-primary m-0 flex items-center gap-2 text-[15px] font-bold">
          {t("priceRange")}
        </h4>
        <button
          type="button"
          className="text-text-primary disabled:text-text-placeholder border-0 bg-transparent text-xs font-medium underline underline-offset-2 disabled:no-underline"
          onClick={onClear}
          disabled={!minValue && !maxValue}
        >
          {t("clear")}
        </button>
      </div>
      <div className="relative mb-4 h-6">
        <div className="range_track bg-stroke-light absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-xs">
          <div
            className="bg-action-primary absolute inset-y-0"
            style={{
              insetInlineStart: `${minPercent}%`,
              insetInlineEnd: `${100 - maxPercent}%`,
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          onChange={(event) => onMinChange(Number(event.target.value))}
          className="thumb thumb_min [&::-moz-range-thumb]:border-action-primary [&::-moz-range-thumb]:bg-surface-elevated [&::-webkit-slider-thumb]:border-action-primary [&::-webkit-slider-thumb]:bg-surface-elevated pointer-events-none absolute inset-x-0 top-1/2 m-0 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:shadow-[0_2px_6px_rgba(30,30,30,0.2)] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(30,30,30,0.2)]"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          onChange={(event) => onMaxChange(Number(event.target.value))}
          className="thumb thumb_max [&::-moz-range-thumb]:border-action-primary [&::-moz-range-thumb]:bg-surface-elevated [&::-webkit-slider-thumb]:border-action-primary [&::-webkit-slider-thumb]:bg-surface-elevated pointer-events-none absolute inset-x-0 top-1/2 m-0 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:shadow-[0_2px_6px_rgba(30,30,30,0.2)] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(30,30,30,0.2)]"
        />
      </div>
      <div className="price_inputs flex gap-3">
        <div className="price_box border-stroke-light bg-surface-on-background flex flex-1 items-center gap-2.5 rounded-md border px-3 py-2.5">
          <Price amount={minValue} currencyOnly size="sm" />
          <div>
            <span className="price_label text-text-placeholder text-[11px] font-medium">
              {t("minimum")}
            </span>
            <input
              type="number"
              value={minValue}
              min={min}
              max={max}
              onChange={(event) => onMinChange(Number(event.target.value))}
              className="text-text-primary w-full [appearance:textfield] border-0 bg-transparent p-0 text-sm font-bold outline-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>
        <div className="price_box border-stroke-light bg-surface-on-background flex flex-1 items-center gap-2.5 rounded-md border px-3 py-2.5">
          <Price amount={maxValue} currencyOnly size="sm" />
          <div>
            <span className="price_label text-text-placeholder text-[11px] font-medium">
              {t("maximum")}
            </span>
            <input
              type="number"
              value={maxValue}
              min={min}
              max={max}
              onChange={(event) => onMaxChange(Number(event.target.value))}
              className="text-text-primary w-full [appearance:textfield] border-0 bg-transparent p-0 text-sm font-bold outline-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
