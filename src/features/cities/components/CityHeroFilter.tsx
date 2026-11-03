"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiCalendar, FiLoader, FiRotateCcw, FiSearch } from "react-icons/fi";
import { DateTimePicker } from "@/shared/ui/DateTimePicker";

interface DateValue {
  date: string;
  time: string;
}

/** Date filter that controls the city-car availability query in the URL. */
export default function CityHeroFilter() {
  const t = useTranslations("cities.hero");
  const filtersT = useTranslations("cars.filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSearching, startSearch] = useTransition();
  const [pickup, setPickup] = useState<DateValue>({
    date: searchParams.get("pickupDate") ?? "",
    time: searchParams.get("pickupTime") ?? "",
  });
  const [dropoff, setDropoff] = useState<DateValue>({
    date: searchParams.get("dropoffDate") ?? "",
    time: searchParams.get("dropoffTime") ?? "",
  });

  const removeDateParams = (params: URLSearchParams) => {
    ["pickupDate", "pickupTime", "dropoffDate", "dropoffTime"].forEach((key) =>
      params.delete(key),
    );
  };

  const updateUrl = (params: URLSearchParams) => {
    router.push(`${pathname}${params.size ? `?${params}` : ""}`);
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    removeDateParams(params);
    // The listing API accepts a date range, never one endpoint on its own.
    if (pickup.date && dropoff.date && dropoff.date > pickup.date) {
      params.set("pickupDate", pickup.date);
      params.set("dropoffDate", dropoff.date);
      if (pickup.time && dropoff.time) {
        params.set("pickupTime", pickup.time);
        params.set("dropoffTime", dropoff.time);
      }
    }
    startSearch(() => updateUrl(params));
  };

  const handleReset = () => {
    setPickup({ date: "", time: "" });
    setDropoff({ date: "", time: "" });
    const params = new URLSearchParams(searchParams.toString());
    removeDateParams(params);
    updateUrl(params);
  };

  const hasDateFilter = Boolean(
    pickup.date || pickup.time || dropoff.date || dropoff.time,
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-2">
      <div className="border-stroke-light bg-surface-elevated/96 relative z-10 -mt-11.25 mb-12 flex items-center rounded-xl border p-3 shadow-[0_12px_40px_rgba(30,30,30,0.08),0_2px_10px_rgba(30,30,30,0.04)] backdrop-blur-[20px] max-md:gap-2 max-sm:p-2">
        <DateControl
          label={t("pickup")}
          value={pickup}
          onChange={setPickup}
          placeholder={t("pickupPlaceholder")}
        />
        <div className="bg-stroke-light h-13.75 w-px max-sm:h-10" />
        <DateControl
          label={t("dropoff")}
          value={dropoff}
          onChange={setDropoff}
          minDate={pickup.date || undefined}
          placeholder={t("dropoffPlaceholder")}
        />
        <button
          type="button"
          className="from-action-primary text-text-on-action flex size-14 shrink-0 items-center justify-center rounded-full border-0 bg-gradient-to-br to-[#3b8bfb] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(31,127,250,0.28)] active:scale-[0.98] max-sm:size-12"
          onClick={handleSearch}
          disabled={isSearching}
          aria-busy={isSearching}
          aria-label={t("search")}
        >
          {isSearching ? (
            <FiLoader className="animate-spin text-xl" aria-hidden="true" />
          ) : (
            <FiSearch className="text-xl" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className="border-stroke-light bg-surface-background text-text-subtle hover:border-action-primary hover:text-action-primary disabled:border-stroke-light disabled:text-text-placeholder ms-2 flex size-14 shrink-0 items-center justify-center rounded-full border transition duration-300 disabled:cursor-not-allowed max-sm:size-12"
          onClick={handleReset}
          disabled={!hasDateFilter}
          aria-label={filtersT("clearAll")}
          title={filtersT("clearAll")}
        >
          <FiRotateCcw className="text-lg" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

interface DateControlProps {
  label: string;
  value: DateValue;
  onChange: (value: DateValue) => void;
  placeholder: string;
  minDate?: string;
}

function DateControl({
  label,
  value,
  onChange,
  placeholder,
  minDate,
}: DateControlProps) {
  return (
    <div className="group flex min-h-18 min-w-0 flex-1 items-center gap-3.5 px-4.5 max-sm:min-h-14 max-sm:gap-0 max-sm:px-0">
      <div className="bg-surface-card-primary text-action-primary group-hover:bg-action-primary group-hover:text-text-on-action flex size-[52px] shrink-0 items-center justify-center rounded-lg text-[22px] transition duration-300 group-hover:scale-105 max-sm:hidden">
        <FiCalendar />
      </div>
      <DateTimePicker
        label={label}
        value={value}
        onChange={onChange}
        minDate={minDate}
        placeholder={placeholder}
      />
    </div>
  );
}
