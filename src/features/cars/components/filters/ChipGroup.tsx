"use client";

import { type ReactNode, useState } from "react";
import { useTranslations } from "next-intl";
import FilterChip from "./FilterChip";

interface ChipItem {
  id: string;
  title: string;
}

interface Props<T extends ChipItem> {
  title: string;
  items: T[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  /** Chips shown before the "+N more" chip; selected chips always show. */
  visibleCount?: number;
  renderVisual?: (item: T) => ReactNode;
}

/** A filter section of toggle chips with a Clear action and an optional "+N more" expander. */
export default function ChipGroup<T extends ChipItem>({
  title,
  items,
  selected,
  onToggle,
  onClear,
  visibleCount,
  renderVisual,
}: Props<T>) {
  const t = useTranslations("cars.filters");
  const [expanded, setExpanded] = useState(false);
  const collapsible = !!visibleCount && items.length > visibleCount;
  const visibleItems =
    collapsible && !expanded
      ? items.filter(
          ({ id }, index) => index < visibleCount || selected.includes(id),
        )
      : items;
  const hidden = items.length - visibleItems.length;
  return (
    <section className="border-stroke-light mb-7 border-b pb-7 last:mb-0 last:border-0 last:pb-0">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-text-primary m-0 text-[15px] font-extrabold">
          {title}
        </h4>
        <button
          type="button"
          className="text-text-primary disabled:text-text-placeholder border-0 bg-transparent text-xs font-medium underline underline-offset-2 disabled:no-underline"
          onClick={onClear}
          disabled={!selected.length}
        >
          {t("clear")}
        </button>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-2.5">
        {visibleItems.map((item) => (
          <FilterChip
            key={item.id}
            label={item.title}
            selected={selected.includes(item.id)}
            onToggle={() => onToggle(item.id)}
            visual={renderVisual?.(item)}
          />
        ))}
        {collapsible && (hidden > 0 || expanded) && (
          <button
            type="button"
            className="border-action-primary/25 text-action-primary hover:bg-surface-card-primary inline-flex min-h-[42px] items-center justify-center rounded-md border border-dashed bg-transparent px-3 py-1.5 text-[13px] font-semibold transition duration-200"
            aria-expanded={expanded}
            onClick={() => setExpanded((previous) => !previous)}
          >
            {expanded ? t("showLess") : t("showMore", { count: hidden })}
          </button>
        )}
      </div>
    </section>
  );
}
