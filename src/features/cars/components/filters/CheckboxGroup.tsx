'use client';

import { ReactNode, useState } from 'react';
import { FiChevronUp } from 'react-icons/fi';
import { useTranslations } from 'next-intl';

interface CheckboxGroupProps {
  icon?: ReactNode;
  title: string;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  visibleCount?: number;
  getLabel?: (item: string) => string;
  renderExtra?: (item: string) => ReactNode;
  itemClassName?: string;
}

export default function CheckboxGroup({ icon, title, items, selected, onToggle, onClear, visibleCount, getLabel = (item) => item, renderExtra, itemClassName = 'check_item' }: CheckboxGroupProps) {
  const t = useTranslations('cars.filters');
  const [expanded, setExpanded] = useState(false);
  const collapsible = !!visibleCount && items.length > visibleCount;
  const visibleItems = collapsible && !expanded ? items.slice(0, visibleCount) : items;
  return (
    <div className="filter_group">
      <div className="filter_title"><h4>{icon}{title}</h4><button type="button" className="view_all" onClick={onClear}>{t('clear')}</button></div>
      {visibleItems.map((item, index) => <label key={`${item}-${index}`} className={itemClassName}><input type="checkbox" checked={selected.includes(`${item}-${index}`)} onChange={() => onToggle(`${item}-${index}`)} />{renderExtra ? renderExtra(item) : <span>{getLabel(item)}</span>}</label>)}
      {collapsible && <button type="button" className="expand_btn" onClick={() => setExpanded((previous) => !previous)}><FiChevronUp className={expanded ? 'rotated' : ''} /><span>{expanded ? t('showLess') : t('showAll')}</span></button>}
    </div>
  );
}
