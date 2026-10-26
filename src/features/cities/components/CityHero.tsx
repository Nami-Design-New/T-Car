"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FiCalendar, FiSearch } from "react-icons/fi";
import { DateTimePicker } from "@/shared/ui/DateTimePicker";
import type { CityDetails } from "../model";

interface Props {
  city: CityDetails;
}

export default function CityHero({ city }: Props) {
  const t = useTranslations("cities.hero");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pickup, setPickup] = useState({
    date: searchParams.get("pickupDate") ?? "",
    time: searchParams.get("pickupTime") ?? "",
  });
  const [dropoff, setDropoff] = useState({
    date: searchParams.get("dropoffDate") ?? "",
    time: searchParams.get("dropoffTime") ?? "",
  });

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (pickup.date) params.set("pickupDate", pickup.date);
    if (pickup.time) params.set("pickupTime", pickup.time);
    if (dropoff.date) params.set("dropoffDate", dropoff.date);
    if (dropoff.time) params.set("dropoffTime", dropoff.time);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="relative h-[450px] overflow-hidden rounded-b-[32px]">
        <Image
          src={city.heroImage}
          alt={city.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_left,rgba(30,30,30,0.15)_0%,rgba(30,30,30,0.65)_55%,rgba(30,30,30,0.85)_100%)]" />
        <div className="relative z-[2] mx-auto flex h-full w-full max-w-[1280px] flex-col items-center justify-center px-4 text-start max-lg:text-center">
          <h1 className="text-text-on-brand mb-3 text-5xl font-extrabold max-lg:text-[2rem]">
            {t("title", { city: city.name })}
          </h1>
          <p className="text-text-on-brand/[0.85] leading-[1.8]">
            {t("description")}
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-2">
        <div className="border-stroke-light bg-surface-elevated/[0.96] relative z-10 -mt-[45px] mb-12 flex items-center rounded-xl border p-3 shadow-[0_12px_40px_rgba(30,30,30,0.08),0_2px_10px_rgba(30,30,30,0.04)] backdrop-blur-[20px] max-md:flex-col max-md:items-stretch max-md:gap-3.5">
          <div className="group flex min-h-[72px] flex-1 items-center gap-3.5 px-[18px]">
            <div className="bg-surface-card-primary text-action-primary group-hover:bg-action-primary group-hover:text-text-on-action flex size-[52px] shrink-0 items-center justify-center rounded-lg text-[22px] transition duration-300 group-hover:scale-105">
              <FiCalendar />
            </div>
            <DateTimePicker
              label={t("pickup")}
              value={pickup}
              onChange={setPickup}
              placeholder={t("pickupPlaceholder")}
            />
          </div>
          <div className="bg-stroke-light h-[55px] w-px max-md:h-px max-md:w-full" />
          <div className="group flex min-h-[72px] flex-1 items-center gap-3.5 px-[18px]">
            <div className="bg-surface-card-primary text-action-primary group-hover:bg-action-primary group-hover:text-text-on-action flex size-[52px] shrink-0 items-center justify-center rounded-lg text-[22px] transition duration-300 group-hover:scale-105">
              <FiCalendar />
            </div>
            <DateTimePicker
              label={t("dropoff")}
              value={dropoff}
              onChange={setDropoff}
              minDate={pickup.date || undefined}
              placeholder={t("dropoffPlaceholder")}
            />
          </div>
          <button
            className="from-action-primary text-text-on-action flex h-16 min-w-[170px] items-center justify-center gap-2.5 rounded-lg border-0 bg-gradient-to-br to-[#3b8bfb] font-bold transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(31,127,250,0.28)] active:scale-[0.98] max-md:w-full"
            onClick={handleSearch}
          >
            <FiSearch className="text-xl" />
            {t("search")}
          </button>
        </div>
      </div>
    </>
  );
}
