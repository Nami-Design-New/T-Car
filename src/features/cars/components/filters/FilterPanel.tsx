"use client";

import { ReactNode, useEffect, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/cn";

interface FilterPanelProps {
  title?: string;
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  hasActiveFilters?: boolean;
  applyLabel?: string;
  clearAllLabel?: string;
  onApply?: () => void;
  onClearAll?: () => void;
  /**
   * Already inside a drawer or dialog: always show the full panel, without
   * the small-screen search bar and bottom sheet of its own.
   */
  embedded?: boolean;
}

function FilterFunnelIcon() {
  return <span aria-hidden="true">≡</span>;
}

export default function FilterPanel({
  title,
  children,
  searchValue = "",
  onSearchChange,
  searchPlaceholder,
  hasActiveFilters = false,
  applyLabel,
  clearAllLabel,
  onApply,
  onClearAll,
  embedded = false,
}: FilterPanelProps) {
  const t = useTranslations("cars.filters");
  const [isOpen, setIsOpen] = useState(false);
  const resolvedTitle = title ?? t("title");
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("searchPlaceholder");
  const resolvedApplyLabel = applyLabel ?? t("apply");
  const resolvedClearAllLabel = clearAllLabel ?? t("clearAll");

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) =>
      event.key === "Escape" && setIsOpen(false);
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  return (
    <>
      {!embedded && (
        <div className="filters_mobile_bar hidden items-center gap-3 max-lg:flex">
          <div className="relative mb-0 flex-1 lg:mb-5.5">
            <FiSearch className="text-text-subtle start-sm pointer-events-none absolute top-1/2 z-1 -translate-y-1/2 text-[19px]" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={resolvedSearchPlaceholder}
              className="border-stroke-light bg-surface-on-background text-text-primary focus:border-action-primary focus:bg-surface-elevated focus:ring-action-primary/10 h-[52px] w-full rounded-md border px-11 text-sm transition outline-none focus:ring-4"
            />
          </div>
          <button
            type="button"
            className="filters_toggle_btn bg-action-primary text-text-on-action hover:bg-action-primary/90 relative flex size-12 shrink-0 items-center justify-center rounded-md border-0 text-xl transition"
            onClick={() => setIsOpen(true)}
            aria-label={t("open")}
          >
            <FilterFunnelIcon />
            {hasActiveFilters && (
              <span className="filters_toggle_dot border-surface-elevated bg-status-error absolute end-1.5 top-1.5 size-2.5 rounded-full border-2" />
            )}
          </button>
        </div>
      )}
      {isOpen && (
        <div
          className="filters_overlay fixed inset-0 z-[1099] bg-black/[0.42] backdrop-blur-[4px]"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={
          embedded
            ? "filters_panel filters_panel--embedded"
            : cn(
                "bg-surface-elevated hidden h-fit self-start rounded-2xl border border-black/6 p-6 shadow-[0_4px_20px_rgba(30,30,30,0.05)] lg:block",
                isOpen &&
                  "is-open fixed inset-y-0 inset-e-0 z-1100 block w-[min(440px,100vw)] overflow-y-auto max-lg:inset-y-auto max-lg:bottom-0 max-lg:h-[85vh] max-lg:max-h-[85vh] max-lg:w-full max-lg:animate-[popup_0.35s_ease] max-lg:rounded-t-2xl max-lg:rounded-b-none",
              )
        }
      >
        <div className="border-stroke-light mb-6 flex items-center justify-between border-b pb-4.5">
          <h3 className="text-text-primary m-0 text-lg font-bold">
            {resolvedTitle}
          </h3>
          {!embedded && (
            <button
              type="button"
              className="text-text-subtle hover:text-text-primary hidden items-center justify-center border-0 bg-transparent text-[22px] max-lg:flex"
              onClick={() => setIsOpen(false)}
              aria-label={t("close")}
            >
              <FiX />
            </button>
          )}
        </div>
        <div
          className={cn(
            "relative mb-0 md:mb-5.5",
            !embedded && "max-lg:hidden",
          )}
        >
          <FiSearch className="text-text-subtle pointer-events-none absolute inset-s-3.75 top-1/2 z-1 -translate-y-1/2 text-[19px]" />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={resolvedSearchPlaceholder}
            className="border-stroke-light bg-surface-on-background text-text-primary focus:border-action-primary focus:bg-surface-elevated focus:ring-action-primary/10 h-[52px] w-full rounded-md border px-11 text-sm transition outline-none focus:ring-4"
          />
        </div>
        {children}
        {(onApply || onClearAll) && (
          <div
            className={
              embedded
                ? "filter_actions border-stroke-light bg-surface-elevated sticky bottom-0 z-[4] mt-1 flex gap-2.5 border-t pt-[18px] pb-5"
                : "filter_actions border-stroke-light max-lg:bg-surface-elevated/98 mt-1 flex gap-2.5 border-t pt-4.5 max-lg:sticky max-lg:bottom-[-24px] max-lg:z-[4] max-lg:-mx-6 max-lg:mt-0 max-lg:mb-[-24px] max-lg:px-6 max-lg:pb-[max(16px,env(safe-area-inset-bottom))] max-lg:shadow-[0_-10px_26px_rgba(30,30,30,0.07)]"
            }
          >
            <button
              type="button"
              className="border-stroke-heavy bg-surface-elevated text-text-subtle hover:border-action-primary hover:text-action-primary disabled:border-stroke-light disabled:text-text-placeholder h-[50px] min-w-0 flex-1 rounded-md border px-3.5 text-sm font-semibold transition disabled:cursor-not-allowed"
              onClick={onClearAll}
              disabled={!hasActiveFilters}
            >
              {resolvedClearAllLabel}
            </button>
            <button
              type="button"
              className="border-action-primary bg-action-primary text-text-on-action hover:bg-action-primary/90 h-[50px] min-w-0 flex-1 rounded-md border px-3.5 text-sm font-semibold transition hover:shadow-[0_9px_20px_rgba(31,127,250,0.22)]"
              onClick={() => {
                onApply?.();
                setIsOpen(false);
              }}
            >
              {resolvedApplyLabel}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
