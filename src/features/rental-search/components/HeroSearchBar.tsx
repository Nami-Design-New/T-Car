"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { FiSearch, FiSliders } from "react-icons/fi";

interface Props {
  /** Called with the trimmed query; empty when the field is blank. */
  onSearch: (query: string) => void;
  onOpenFilters: () => void;
}

export default function HeroSearchBar({ onSearch, onOpenFilters }: Props) {
  const t = useTranslations();
  const [search, setSearch] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(search.trim());
  };

  return (
    <form
      className="hero_search mx-auto mb-3.5 flex w-[min(760px,calc(100%-32px))] items-center gap-2.5 rounded-2xl border border-white/74 bg-surface-elevated/94 p-2 shadow-[0_24px_55px_rgba(30,30,30,0.24)] backdrop-blur-[14px] max-md:mb-3 max-md:w-full"
      onSubmit={handleSubmit}
    >
      <div className="hero_search_field relative flex-1">
        <FiSearch
          className="pointer-events-none absolute inset-s-4.25 top-1/2 -translate-y-1/2 text-action-primary"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("cars.filters.searchPlaceholder")}
          aria-label={t("cars.filters.searchPlaceholder")}
          className="h-13 w-full rounded-xl border border-stroke-light bg-surface-on-background px-12 text-text-primary outline-none focus:border-action-primary focus:ring-4 focus:ring-action-primary/15"
        />
      </div>
      <button
        type="submit"
        className="hero_search_submit inline-flex h-13 items-center justify-center gap-2 rounded-xl border-0 bg-action-primary px-5.5 font-bold text-text-on-action transition duration-200 hover:-translate-y-0.5 max-sm:w-13 max-sm:px-0"
      >
        <FiSearch aria-hidden="true" />
        <span className="max-sm:hidden">{t("search.submit")}</span>
      </button>
      <button
        type="button"
        className="hero_filter_toggle inline-flex size-[52px] items-center justify-center rounded-xl border-0 bg-surface-card-primary text-[21px] text-action-primary transition duration-200 hover:-translate-y-0.5"
        onClick={onOpenFilters}
        aria-label={t("cars.filters.open")}
        title={t("cars.filters.open")}
      >
        <FiSliders aria-hidden="true" />
      </button>
    </form>
  );
}
