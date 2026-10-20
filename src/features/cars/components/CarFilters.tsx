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
}

export default function CarFilters({ brands: brandOptions, onApply }: Props) {
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
    >
      <section className="filter_group chip_filter_group">
        <div className="filter_title">
          <h4>{t("filters.brand")}</h4>
          <button
            type="button"
            className="view_all"
            onClick={() => clear("brandIds")}
            disabled={!filters.brandIds.length}
          >
            {t("filters.clear")}
          </button>
        </div>
        <div className="filter_chip_list">
          {brandOptions.map(({ id, slug, logo }) => {
            const selected = filters.brandIds.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={`filter_chip brand_filter_chip${selected ? " is-selected" : ""}`}
                aria-pressed={selected}
                onClick={() => toggle("brandIds", id)}
              >
                <span className="filter_chip_visual brand_chip_logo">
                  <Image src={logo} alt="" width={24} height={24} />
                </span>
                <span className="filter_chip_label">{t(`brands.${slug}`)}</span>
                {selected && (
                  <span className="filter_chip_remove" aria-hidden="true">
                    <FiX />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
      <section className="filter_group chip_filter_group">
        <div className="filter_title">
          <h4>{t("filters.type")}</h4>
          <button
            type="button"
            className="view_all"
            onClick={() => clear("types")}
            disabled={!filters.types.length}
          >
            {t("filters.clear")}
          </button>
        </div>
        <div className="filter_chip_list car_type_chip_list">
          {CAR_TYPES.map(({ id, key, icon: Icon }) => {
            const selected = filters.types.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={`filter_chip car_type_filter_chip${selected ? " is-selected" : ""}`}
                aria-pressed={selected}
                onClick={() => toggle("types", id)}
              >
                <span
                  className="filter_chip_visual car_type_icon"
                  aria-hidden="true"
                >
                  <Icon />
                </span>
                <span className="filter_chip_label">{t(`types.${key}`)}</span>
                {selected && (
                  <span className="filter_chip_remove" aria-hidden="true">
                    <FiX />
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
          <div>
            <span className="service_title">
              {t("services.delivery.title")}
            </span>
            <span className="service_desc">
              {t("services.delivery.description")}
            </span>
          </div>
        )}
      />
    </FilterPanel>
  );
}
