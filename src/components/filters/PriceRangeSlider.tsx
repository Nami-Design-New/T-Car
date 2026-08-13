import { FiDollarSign } from 'react-icons/fi';

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
  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className="filter_group">
      <div className="filter_title">
        <h4>
          <FiDollarSign />
          نطاق السعر
        </h4>
        <button type="button" className="view_all" onClick={onClear}>
          مسح
        </button>
      </div>

      <div className="range_slider">
        <div className="range_track">
          <div
            className="range_fill"
            style={{ right: `${minPercent}%`, left: `${100 - maxPercent}%` }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          onChange={(e) => onMinChange(Number(e.target.value))}
          className="thumb thumb_min"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          onChange={(e) => onMaxChange(Number(e.target.value))}
          className="thumb thumb_max"
        />
      </div>

      <div className="price_inputs">
        <div className="price_box">
          <FiDollarSign />
          <div>
            <span className="price_label">الحد الأدنى</span>
            <input
              type="number"
              value={minValue}
              min={min}
              max={max}
              onChange={(e) => onMinChange(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="price_box">
          <FiDollarSign />
          <div>
            <span className="price_label">الحد الأقصى</span>
            <input
              type="number"
              value={maxValue}
              min={min}
              max={max}
              onChange={(e) => onMaxChange(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}