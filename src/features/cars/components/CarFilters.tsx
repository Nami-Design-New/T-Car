"use client";
import { FiShield, FiTruck } from "react-icons/fi";
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
import ChipGroup from "./filters/ChipGroup";
import {
  createDefaultCarFilters,
  applyCarFilterDraft,
  parseCarFilterDraft,
  type CarFilterDraft,
  type PriceRange,
} from "../searchParams";
import { useEffect, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import type { CarBrand, CityCarFilterOptions } from "../model";
import { IMAGES } from "@/shared/config/assets";

const COMPANIES = ["elite", "elite", "elite", "elite", "elite"];
const SERVICES = ["delivery", "delivery", "delivery", "delivery"];
/** How long typing pauses before the search reaches the URL. */
const SEARCH_DEBOUNCE_MS = 400;
/** Brand and type chips shown before the "+N more" chip. */
const VISIBLE_CHIPS = 3;
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
  /** Live city-car lookups; other listing surfaces retain their mock options. */
  cityOptions?: CityCarFilterOptions;
  priceRange: PriceRange;
  onApply?: (filters: CarFilterDraft) => void;
  /** Rendered inside a drawer: show the full panel at every width. */
  embedded?: boolean;
}

export default function CarFilters({
  brands: brandOptions,
  cityOptions,
  priceRange,
  onApply,
  embedded,
}: Props) {
  const t = useTranslations("cars");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isApplying, startApplying] = useTransition();
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
  const brands =
    cityOptions?.brands ??
    brandOptions.map(({ id, slug, logo }) => ({
      id,
      title: t(`brands.${slug}`),
      logo,
    }));
  const types =
    cityOptions?.types ??
    CAR_TYPES.map(({ id, key }) => ({
      id,
      title: t(`types.${key}`),
    }));
  const companies =
    cityOptions?.companies ??
    COMPANIES.map((title, index) => ({
      id: `${title}-${index}`,
      title: t("companies.elite"),
    }));
  const services =
    cityOptions?.services ??
    SERVICES.map((title, index) => ({
      id: `${title}-${index}`,
      title: t("services.delivery.title"),
    }));
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
      startApplying(() => onApply(values));
      return;
    }
    const params = applyCarFilterDraft(
      new URLSearchParams(searchParams.toString()),
      values,
      priceRange,
    );
    startApplying(() => {
      router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, {
        scroll: false,
      });
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
        if (!onApply) searchInUrl(value);
      }}
      hasActiveFilters={active}
      onClearAll={clearAll}
      onApply={apply}
      applying={isApplying}
      embedded={embedded}
    >
      <ChipGroup
        title={t("filters.brand")}
        items={brands}
        selected={filters.brandIds}
        onToggle={(id) => toggle("brandIds", id)}
        onClear={() => clear("brandIds")}
        visibleCount={VISIBLE_CHIPS}
        renderVisual={({ logo }) => (
          <Image
            src={logo ?? IMAGES.imageFallback.src}
            alt=""
            width={24}
            height={24}
            className="size-5.5 object-contain"
          />
        )}
      />
      <ChipGroup
        title={t("filters.type")}
        items={types}
        selected={filters.types}
        onToggle={(id) => toggle("types", id)}
        onClear={() => clear("types")}
        visibleCount={VISIBLE_CHIPS}
      />
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
        items={companies}
        selected={filters.companyIds}
        onToggle={(value) => toggle("companyIds", value)}
        onClear={() => clear("companyIds")}
        visibleCount={3}
      />
      <CheckboxGroup
        icon={<FiShield />}
        title={t("filters.services")}
        items={services}
        selected={filters.serviceIds}
        onToggle={(value) => toggle("serviceIds", value)}
        onClear={() => clear("serviceIds")}
        visibleCount={2}
        itemClassName="check_item service_item"
        renderExtra={(item) => (
          <div className="flex flex-col gap-0.5">
            <span className="service_title text-text-primary block text-sm leading-[1.3] font-semibold">
              {item.title}
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
