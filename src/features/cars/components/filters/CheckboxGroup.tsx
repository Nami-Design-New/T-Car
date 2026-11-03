"use client";

import { ReactNode, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ICONS } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";

interface CheckboxGroupProps {
  icon?: ReactNode;
  title: string;
  items: { id: string; title: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  visibleCount?: number;
  getLabel?: (item: { id: string; title: string }) => string;
  renderExtra?: (item: { id: string; title: string }) => ReactNode;
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
  getLabel = (item) => item.title,
  renderExtra,
  itemClassName = "check_item",
}: CheckboxGroupProps) {
  const t = useTranslations("cars.filters");
  const [expanded, setExpanded] = useState(false);
  const collapsible = !!visibleCount && items.length > visibleCount;
  const visibleItems =
    collapsible && !expanded ? items.slice(0, visibleCount) : items;
  return (
    <div className="filter_group border-stroke-light mb-7 border-b pb-7 last:mb-0 last:border-0 last:pb-0">
      <div className="filter_title mb-[18px] flex items-center justify-between">
        <h4 className="text-text-primary [&>svg]:text-action-primary m-0 flex items-center gap-2 text-[15px] font-bold">
          {icon}
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
      {visibleItems.map((item) => (
        <label
          key={item.id}
          className={cn(
            "check_item [&>input]:accent-action-primary [&>span]:text-text-subtle flex cursor-pointer items-center gap-2.5 py-2.5 [&>input]:size-[18px] [&>input]:shrink-0 [&>input]:cursor-pointer [&>span]:text-sm [&>span]:font-medium",
            itemClassName,
            itemClassName.includes("service_item") &&
              "[&_.service_title]:text-text-primary [&_.service_desc]:text-text-placeholder !items-start [&_.service_desc]:block [&_.service_desc]:text-xs [&_.service_desc]:leading-[1.35] [&_.service_desc]:font-normal [&_.service_title]:block [&_.service_title]:text-sm [&_.service_title]:leading-[1.3] [&_.service_title]:font-semibold [&>div]:flex [&>div]:flex-col [&>div]:gap-0.5 [&>input]:mt-0.5",
          )}
        >
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={() => onToggle(item.id)}
          />
          {renderExtra ? renderExtra(item) : <span>{getLabel(item)}</span>}
        </label>
      ))}
      {collapsible && (
        <button
          type="button"
          className="text-action-primary mx-auto mt-2 flex items-center justify-center gap-1.5 border-0 bg-transparent text-sm font-normal"
          aria-expanded={expanded}
          onClick={() => setExpanded((previous) => !previous)}
        >
          <span>{expanded ? t("showLess") : t("showAll")}</span>
          {/* Points to the inline end when collapsed, up when expanded. */}
          <Image
            src={ICONS.chevronLeftPrimary.src}
            width={ICONS.chevronLeftPrimary.width}
            height={ICONS.chevronLeftPrimary.height}
            alt=""
            aria-hidden="true"
            className={cn(
              "transition duration-300",
              expanded ? "rotate-90" : "ltr:rotate-180",
            )}
          />
        </button>
      )}
    </div>
  );
}
