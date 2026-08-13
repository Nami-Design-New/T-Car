'use client';

import { ReactNode, useState } from 'react';
import { FiChevronUp } from 'react-icons/fi';

interface CheckboxGroupProps {
  icon?: ReactNode;
  title: string;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  visibleCount?: number; // لو موجودة، بيتفعّل زرار "عرض الكل"
  getLabel?: (item: string) => string;
  renderExtra?: (item: string) => ReactNode; // لو محتاج وصف تحت العنوان (زي الخدمات)
  itemClassName?: string; // زي 'service_item'
}

export default function CheckboxGroup({
  icon,
  title,
  items,
  selected,
  onToggle,
  onClear,
  visibleCount,
  getLabel = (item) => item,
  renderExtra,
  itemClassName = 'check_item',
}: CheckboxGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const collapsible = !!visibleCount && items.length > visibleCount;
  const visibleItems =
    collapsible && !expanded ? items.slice(0, visibleCount) : items;

  return (
    <div className="filter_group">
      <div className="filter_title">
        <h4>
          {icon}
          {title}
        </h4>
        <button type="button" className="view_all" onClick={onClear}>
          مسح
        </button>
      </div>

      {visibleItems.map((item, i) => (
        <label key={`${item}-${i}`} className={itemClassName}>
          <input
            type="checkbox"
            checked={selected.includes(`${item}-${i}`)}
            onChange={() => onToggle(`${item}-${i}`)}
          />
          {renderExtra ? renderExtra(item) : <span>{getLabel(item)}</span>}
        </label>
      ))}

      {collapsible && (
        <button
          type="button"
          className="expand_btn"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <FiChevronUp className={expanded ? 'rotated' : ''} />
          <span>{expanded ? 'عرض أقل' : 'عرض الكل'}</span>
        </button>
      )}
    </div>
  );
}