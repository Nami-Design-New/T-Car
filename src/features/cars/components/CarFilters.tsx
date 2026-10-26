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
  DEFAULT_CAR_FILTERS,
  PRICE_MAX,
  PRICE_MIN,
  applyCarFilterDraft,
  parseCarFilterDraft,
  type CarFilterDraft,
} from "../searchParams";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { CarBrand } from "../model";
import { cn } from "@/shared/lib/cn";

const COMPANIES = ["elite", "elite", "elite", "elite", "elite"];
const SERVICES = ["delivery", "delivery", "delivery", "delivery"];
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
  onApply?: (filters: CarFilterDraft) => void;
  /** Rendered inside a drawer: show the full panel at every width. */
  embedded?: boolean;
}

export default function CarFilters({
  brands: brandOptions,
  onApply,
  embedded,
}: Props) {
  const t = useTranslations("cars");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { control, handleSubmit, reset, setValue } = useForm<CarFilterDraft>({
    defaultValues: DEFAULT_CAR_FILTERS,
  });
  const watchedFilters = useWatch({
    control,
    defaultValue: DEFAULT_CAR_FILTERS,
  });
  const filters: CarFilterDraft = {
    query: watchedFilters.query ?? "",
    minPrice: watchedFilters.minPrice ?? PRICE_MIN,
    maxPrice: watchedFilters.maxPrice ?? PRICE_MAX,
    brandIds: watchedFilters.brandIds ?? [],
    types: watchedFilters.types ?? [],
    companyIds: watchedFilters.companyIds ?? [],
    serviceIds: watchedFilters.serviceIds ?? [],
  };
  useEffect(() => {
    reset(parseCarFilterDraft(Object.fromEntries(searchParams.entries())));
  }, [reset, searchParams]);

  const submit = (values: CarFilterDraft) => {
    if (onApply) {
      onApply(values);
      return;
    }
    const params = applyCarFilterDraft(
      new URLSearchParams(searchParams.toString()),
      values,
    );
    router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, {
      scroll: false,
    });
  };

  const apply = () => {
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

  const clearAll = () => reset(DEFAULT_CAR_FILTERS);
  const active =
    filters.query.trim() !== "" ||
    filters.minPrice !== PRICE_MIN ||
    filters.maxPrice !== PRICE_MAX ||
    filters.brandIds.length > 0 ||
    filters.types.length > 0 ||
    filters.companyIds.length > 0 ||
    filters.serviceIds.length > 0;
  return (
    <FilterPanel
      searchValue={filters.query}
      onSearchChange={(value) =>
        setValue("query", value, { shouldDirty: true })
      }
      hasActiveFilters={active}
      onClearAll={clearAll}
      onApply={apply}
      embedded={embedded}
    >
      <section className="filter_group chip_filter_group mb-7 border-b border-stroke-light pb-7 last:mb-0 last:border-0 last:pb-0">
        <div className="filter_title mb-3 flex items-center justify-between">
          <h4 className="m-0 text-[15px] font-extrabold text-text-primary">{t("filters.brand")}</h4>
          <button
            type="button"
            className="view_all border-0 bg-transparent text-xs font-medium text-text-primary underline underline-offset-2 disabled:text-text-placeholder disabled:no-underline"
            onClick={() => clear("brandIds")}
            disabled={!filters.brandIds.length}
          >
            {t("filters.clear")}
          </button>
        </div>
        <div className="filter_chip_list flex flex-wrap gap-x-2 gap-y-2.5">
          {brandOptions.map(({ id, slug, logo }) => {
            const selected = filters.brandIds.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={cn(
                  "filter_chip brand_filter_chip inline-flex min-h-[42px] max-w-full flex-[1_1_calc(50%_-_4px)] items-center justify-center gap-1.5 rounded-md border border-transparent bg-surface-on-background px-2.5 py-1.5 text-text-primary transition duration-200 hover:-translate-y-px hover:border-action-primary/25 hover:bg-surface-card-primary",
                  selected && "is-selected !border-action-primary !bg-action-primary !text-text-on-action shadow-[0_7px_16px_rgba(31,127,250,0.18)]",
                )}
                aria-pressed={selected}
                onClick={() => toggle("brandIds", id)}
              >
                <span className="filter_chip_visual brand_chip_logo grid size-[26px] shrink-0 place-items-center rounded-full bg-surface-elevated">
                  <Image src={logo} alt="" width={24} height={24} className="size-[22px] object-contain" />
                </span>
                <span className="filter_chip_label min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium leading-[1.35]">{t(`brands.${slug}`)}</span>
                {selected && (
                  <span className="filter_chip_remove grid size-[21px] shrink-0 place-items-center rounded-full bg-surface-elevated text-text-primary" aria-hidden="true">
                    <FiX className="text-[15px]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
      <section className="filter_group chip_filter_group mb-7 border-b border-stroke-light pb-7 last:mb-0 last:border-0 last:pb-0">
        <div className="filter_title mb-3 flex items-center justify-between">
          <h4 className="m-0 text-[15px] font-extrabold text-text-primary">{t("filters.type")}</h4>
          <button
            type="button"
            className="view_all border-0 bg-transparent text-xs font-medium text-text-primary underline underline-offset-2 disabled:text-text-placeholder disabled:no-underline"
            onClick={() => clear("types")}
            disabled={!filters.types.length}
          >
            {t("filters.clear")}
          </button>
        </div>
        <div className="filter_chip_list car_type_chip_list flex flex-wrap gap-x-2 gap-y-2.5">
          {CAR_TYPES.map(({ id, key, icon: Icon }) => {
            const selected = filters.types.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={cn(
                  "filter_chip car_type_filter_chip inline-flex min-h-[42px] flex-[0_1_auto] items-center justify-center gap-1.5 rounded-md border border-transparent bg-surface-on-background px-2.5 py-1.5 text-text-primary transition duration-200 hover:-translate-y-px hover:border-action-primary/25 hover:bg-surface-card-primary",
                  selected && "is-selected !border-action-primary !bg-action-primary !text-text-on-action shadow-[0_7px_16px_rgba(31,127,250,0.18)] [&_.car_type_icon]:!text-text-on-action",
                )}
                aria-pressed={selected}
                onClick={() => toggle("types", id)}
              >
                <span
                  className={cn(
                    "filter_chip_visual car_type_icon grid shrink-0 place-items-center text-[27px] leading-none text-text-subtle",
                    selected && "!text-text-on-action",
                  )}
                  aria-hidden="true"
                >
                  <Icon />
                </span>
                <span className="filter_chip_label min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium leading-[1.35]">{t(`types.${key}`)}</span>
                {selected && (
                  <span className="filter_chip_remove grid size-[21px] shrink-0 place-items-center rounded-full bg-surface-elevated text-text-primary" aria-hidden="true">
                    <FiX className="text-[15px]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
      <PriceRangeSlider
        min={PRICE_MIN}
        max={PRICE_MAX}
        minValue={filters.minPrice}
        maxValue={filters.maxPrice}
        onMinChange={(value) =>
          setValue(
            "minPrice",
            Math.min(Math.max(value, PRICE_MIN), filters.maxPrice - 1),
            { shouldDirty: true },
          )
        }
        onMaxChange={(value) =>
          setValue(
            "maxPrice",
            Math.max(Math.min(value, PRICE_MAX), filters.minPrice + 1),
            { shouldDirty: true },
          )
        }
        onClear={() => {
          setValue("minPrice", PRICE_MIN, { shouldDirty: true });
          setValue("maxPrice", PRICE_MAX, { shouldDirty: true });
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
            <span className="service_title block text-sm font-semibold leading-[1.3] text-text-primary">
              {t("services.delivery.title")}
            </span>
            <span className="service_desc block text-xs font-normal leading-[1.35] text-text-placeholder">
              {t("services.delivery.description")}
            </span>
          </div>
        )}
      />
    </FilterPanel>
  );
}
