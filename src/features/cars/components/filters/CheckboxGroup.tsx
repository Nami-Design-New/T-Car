'use client';

import { ReactNode, useState } from 'react';
import { FiChevronUp } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';

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
  const t = useTranslations('cars.filters');
  const [expanded, setExpanded] = useState(false);
  const collapsible = !!visibleCount && items.length > visibleCount;
  const visibleItems = collapsible && !expanded ? items.slice(0, visibleCount) : items;
  return (
    <div className="filter_group mb-7 border-b border-stroke-light pb-7 last:mb-0 last:border-0 last:pb-0">
      <div className="filter_title mb-[18px] flex items-center justify-between">
        <h4 className="m-0 flex items-center gap-2 text-[15px] font-bold text-text-primary [&>svg]:text-action-primary">
          {icon}
          {title}
        </h4>
        <button type="button" className="view_all border-0 bg-transparent text-[13px] font-semibold text-action-primary" onClick={onClear}>
          {t('clear')}
        </button>
      </div>
      {visibleItems.map((item, index) => (
        <label key={`${item}-${index}`} className={cn(
          'check_item flex cursor-pointer items-center gap-2.5 py-2.5 [&>input]:size-[18px] [&>input]:shrink-0 [&>input]:cursor-pointer [&>input]:accent-action-primary [&>span]:text-sm [&>span]:font-medium [&>span]:text-text-subtle',
          itemClassName,
          itemClassName.includes('service_item') && '!items-start [&>input]:mt-0.5 [&>div]:flex [&>div]:flex-col [&>div]:gap-0.5 [&_.service_title]:block [&_.service_title]:text-sm [&_.service_title]:font-semibold [&_.service_title]:leading-[1.3] [&_.service_title]:text-text-primary [&_.service_desc]:block [&_.service_desc]:text-xs [&_.service_desc]:font-normal [&_.service_desc]:leading-[1.35] [&_.service_desc]:text-text-placeholder',
        )}>
          <input
            type="checkbox"
            checked={selected.includes(`${item}-${index}`)}
            onChange={() => onToggle(`${item}-${index}`)}
          />
          {renderExtra ? renderExtra(item) : <span>{getLabel(item)}</span>}
        </label>
      ))}
      {collapsible && (
        <button
          type="button"
          className="expand_btn mt-2 flex items-center gap-1.5 border-0 bg-transparent text-[13px] font-semibold text-action-primary"
          onClick={() => setExpanded((previous) => !previous)}
        >
          <FiChevronUp className={cn('text-[15px] transition duration-300', expanded && 'rotate-[-90deg]')} />
          <span>{expanded ? t('showLess') : t('showAll')}</span>
        </button>
      )}
    </div>
  );
}
