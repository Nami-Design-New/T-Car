"use client";
import { FiShield, FiTruck, FiX } from "react-icons/fi";
import {
  TbCar,
  TbCar4Wd,
  TbCaravan,
  TbCarOffRoad,
  TbCarSuv,
  TbTruck,
} from "react-icons/tb";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import FilterPanel from "./filters/FilterPanel";
import PriceRangeSlider from "./filters/PriceRangeSlider";
import CheckboxGroup from "./filters/CheckboxGroup";
import {
  createDefaultCarFilters,
  applyCarFilterDraft,
  parseCarFilterDraft,
  type CarFilterDraft,
  type PriceRange,
} from "../searchParams";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import type { CarBrand } from "../model";
import { cn } from "@/shared/lib/cn";

const COMPANIES = ["elite", "elite", "elite", "elite", "elite"];
const SERVICES = ["delivery", "delivery", "delivery", "delivery"];
/** How long typing pauses before the search reaches the URL. */
const SEARCH_DEBOUNCE_MS = 400;
const CAR_TYPES = [
  { id: "family", key: "family", icon: TbCarSuv },
  { id: "convertible", key: "convertible", icon: TbCar },
  { id: "hatchback", key: "hatchback", icon: TbCar4Wd },
  { id: "sedan", key: "sedan", icon: TbCarOffRoad },
  { id: "pickup", key: "pickup", icon: TbTruck },
  { id: "van", key: "van", icon: TbCaravan },
];
interface Props {
  brands: CarBrand[];
  priceRange: PriceRange;
  onApply?: (filters: CarFilterDraft) => void;
  /** Rendered inside a drawer: show the full panel at every width. */
  embedded?: boolean;
}

export default function CarFilters({
  brands: brandOptions,
  priceRange,
  onApply,
  embedded,
}: Props) {
  const t = useTranslations("cars");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultFilters = createDefaultCarFilters(priceRange);
  const { control, handleSubmit, reset, setValue } = useForm<CarFilterDraft>({
    defaultValues: defaultFilters,
  });
  const watchedFilters = useWatch({
    control,
    defaultValue: defaultFilters,
  });
  const filters: CarFilterDraft = {
    query: watchedFilters.query ?? "",
    minPrice: watchedFilters.minPrice ?? priceRange.min,
    maxPrice: watchedFilters.maxPrice ?? priceRange.max,
    brandIds: watchedFilters.brandIds ?? [],
    types: watchedFilters.types ?? [],
    companyIds: watchedFilters.companyIds ?? [],
    serviceIds: watchedFilters.serviceIds ?? [],
  };
  // Keep fields the user is editing: a live search changes the URL, and that
  // must not drop brands or types picked but not applied yet.
  useEffect(() => {
    reset(
      parseCarFilterDraft(
        Object.fromEntries(searchParams.entries()),
        priceRange,
      ),
      { keepDirtyValues: true },
    );
  }, [reset, searchParams, priceRange]);

  /** Live search: only `q` changes; the other filters still wait for Apply. */
  const searchInUrl = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const query = value.trim();
    if (query) params.set("q", query);
    else params.delete("q");
    router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, {
      scroll: false,
    });
  }, SEARCH_DEBOUNCE_MS);

  const submit = (values: CarFilterDraft) => {
    if (onApply) {
      onApply(values);
      return;
    }
    const params = applyCarFilterDraft(
      new URLSearchParams(searchParams.toString()),
      values,
      priceRange,
    );
    router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, {
      scroll: false,
    });
  };

  const apply = () => {
    // The submit carries the search too.
    searchInUrl.cancel();
    void handleSubmit(submit)();
  };

  const toggle = (
    name: "brandIds" | "types" | "companyIds" | "serviceIds",
    value: string,
  ) => {
    const values = filters[name] ?? [];
    setValue(
      name,
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
      {
        shouldDirty: true,
      },
    );
  };

  const clear = (name: "brandIds" | "types" | "companyIds" | "serviceIds") => {
    setValue(name, [], { shouldDirty: true });
  };

  const clearAll = () => reset(defaultFilters);
  const active =
    filters.query.trim() !== "" ||
    filters.minPrice !== priceRange.min ||
    filters.maxPrice !== priceRange.max ||
    filters.brandIds.length > 0 ||
    filters.types.length > 0 ||
    filters.companyIds.length > 0 ||
    filters.serviceIds.length > 0;
  return (
    <FilterPanel
      searchValue={filters.query}
      onSearchChange={(value) => {
        setValue("query", value, { shouldDirty: true });
        // The hero drawer (onApply) searches only when applied.
        if (!onApply) searchInUrl(value);
      }}
      hasActiveFilters={active}
      onClearAll={clearAll}
      onApply={apply}
      embedded={embedded}
    >
      <section className="border-stroke-light mb-7 border-b pb-7 last:mb-0 last:border-0 last:pb-0">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-text-primary m-0 text-[15px] font-extrabold">
            {t("filters.brand")}
          </h4>
          <button
            type="button"
            className="text-text-primary disabled:text-text-placeholder border-0 bg-transparent text-xs font-medium underline underline-offset-2 disabled:no-underline"
            onClick={() => clear("brandIds")}
            disabled={!filters.brandIds.length}
          >
            {t("filters.clear")}
          </button>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-2.5">
          {brandOptions.map(({ id, slug, logo }) => {
            const selected = filters.brandIds.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={cn(
                  "filter_chip brand_filter_chip bg-surface-on-background text-text-primary hover:border-action-primary/25 hover:bg-surface-card-primary inline-flex min-h-[42px] max-w-full flex-[1_1_calc(50%_-_4px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 py-1.5 transition duration-200 hover:-translate-y-px",
                  selected &&
                    "is-selected !border-action-primary !bg-action-primary !text-text-on-action shadow-[0_7px_16px_rgba(31,127,250,0.18)]",
                )}
                aria-pressed={selected}
                onClick={() => toggle("brandIds", id)}
              >
                <span className="filter_chip_visual brand_chip_logo bg-surface-elevated grid size-[26px] shrink-0 place-items-center rounded-full">
                  <Image
                    src={logo}
                    alt=""
                    width={24}
                    height={24}
                    className="size-[22px] object-contain"
                  />
                </span>
                <span className="filter_chip_label min-w-0 overflow-hidden text-[13px] leading-[1.35] font-medium text-ellipsis whitespace-nowrap">
                  {t(`brands.${slug}`)}
                </span>
                {selected && (
                  <span
                    className="filter_chip_remove bg-surface-elevated text-text-primary grid size-[21px] shrink-0 place-items-center rounded-full"
                    aria-hidden="true"
                  >
                    <FiX className="text-[15px]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
      <section className="border-stroke-light mb-7 border-b pb-7 last:mb-0 last:border-0 last:pb-0">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-text-primary m-0 text-[15px] font-extrabold">
            {t("filters.type")}
          </h4>
          <button
            type="button"
            className="text-text-primary disabled:text-text-placeholder border-0 bg-transparent text-xs font-medium underline underline-offset-2 disabled:no-underline"
            onClick={() => clear("types")}
            disabled={!filters.types.length}
          >
            {t("filters.clear")}
          </button>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-2.5">
          {CAR_TYPES.map(({ id, key, icon: Icon }) => {
            const selected = filters.types.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={cn(
                  "bg-surface-on-background text-text-primary hover:border-action-primary/25 hover:bg-surface-card-primary inline-flex min-h-[42px] flex-[0_1_auto] items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 py-1.5 transition duration-200 hover:-translate-y-px",
                  selected &&
                    "is-selected !border-action-primary !bg-action-primary !text-text-on-action [&_.car_type_icon]:!text-text-on-action shadow-[0_7px_16px_rgba(31,127,250,0.18)]",
                )}
                aria-pressed={selected}
                onClick={() => toggle("types", id)}
              >
                <span
                  className={cn(
                    "text-text-subtle grid shrink-0 place-items-center text-[27px] leading-none",
                    selected && "!text-text-on-action",
                  )}
                  aria-hidden="true"
                >
                  <Icon />
                </span>
                <span className="min-w-0 overflow-hidden text-[13px] leading-[1.35] font-medium text-ellipsis whitespace-nowrap">
                  {t(`types.${key}`)}
                </span>
                {selected && (
                  <span
                    className="bg-surface-elevated text-text-primary grid size-5 shrink-0 place-items-center rounded-full"
                    aria-hidden="true"
                  >
                    <FiX className="text-[15px]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
      <PriceRangeSlider
        min={priceRange.min}
        max={priceRange.max}
        minValue={filters.minPrice}
        maxValue={filters.maxPrice}
        onMinChange={(value) =>
          setValue(
            "minPrice",
            Math.min(Math.max(value, priceRange.min), filters.maxPrice - 1),
            { shouldDirty: true },
          )
        }
        onMaxChange={(value) =>
          setValue(
            "maxPrice",
            Math.max(Math.min(value, priceRange.max), filters.minPrice + 1),
            { shouldDirty: true },
          )
        }
        onClear={() => {
          setValue("minPrice", priceRange.min, { shouldDirty: true });
          setValue("maxPrice", priceRange.max, { shouldDirty: true });
        }}
      />
      <CheckboxGroup
        icon={<FiTruck />}
        title={t("filters.companies")}
        items={COMPANIES}
        getLabel={() => t("companies.elite")}
        selected={filters.companyIds}
        onToggle={(value) => toggle("companyIds", value)}
        onClear={() => clear("companyIds")}
        visibleCount={3}
      />
      <CheckboxGroup
        icon={<FiShield />}
        title={t("filters.services")}
        items={SERVICES}
        selected={filters.serviceIds}
        onToggle={(value) => toggle("serviceIds", value)}
        onClear={() => clear("serviceIds")}
        visibleCount={2}
        itemClassName="check_item service_item"
        renderExtra={() => (
          <div className="flex flex-col gap-0.5">
            <span className="service_title text-text-primary block text-sm leading-[1.3] font-semibold">
              {t("services.delivery.title")}
            </span>
            <span className="service_desc text-text-placeholder block text-xs leading-[1.35] font-normal">
              {t("services.delivery.description")}
            </span>
          </div>
        )}
      />
    </FilterPanel>
  );
}
