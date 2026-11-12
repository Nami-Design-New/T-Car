"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { RENTAL_ICONS } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";
const dailyIcon = RENTAL_ICONS.daily;
const monthlyIcon = RENTAL_ICONS.monthly;
const airportIcon = RENTAL_ICONS.airport;
const stationIcon = RENTAL_ICONS.station;
const internationalIcon = RENTAL_ICONS.international;

import type { RentalType } from "../model";

interface Props {
  onSelect: (type: RentalType) => void;
  availability: Record<RentalType, boolean>;
  /** The booking dialog uses large equal cards; the hero keeps its compact tabs. */
  variant?: "hero" | "dialog";
}

const tabs: {
  id: RentalType;
  title: string;
  icon: { src: string; width: number; height: number };
  type: RentalType;
}[] = [
  {
    id: "daily",
    title: "rentalTabs.daily",
    icon: dailyIcon,
    type: "daily",
  },
  {
    id: "monthly",
    title: "rentalTabs.monthly",
    icon: monthlyIcon,
    type: "monthly",
  },
  {
    id: "airport",
    title: "rentalTabs.airport",
    icon: airportIcon,
    type: "airport",
  },
  {
    id: "station",
    title: "rentalTabs.station",
    icon: stationIcon,
    type: "station",
  },
  {
    id: "international",
    title: "rentalTabs.international",
    icon: internationalIcon,
    type: "international",
  },
];

export default function RentalTabs({
  onSelect,
  availability,
  variant = "hero",
}: Props) {
  const t = useTranslations();
  const availableTabs = tabs.filter((tab) => availability[tab.type]);
  const hasTwoOrFewerChoices = availableTabs.length <= 2;

  if (variant === "dialog") {
    return (
      <div className="flex flex-wrap gap-3 sm:gap-5">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.type)}
            className="group bg-primary-100 hover:bg-primary-200 focus-visible:outline-action-primary flex min-h-35 min-w-1/3 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border-0 px-3 py-4 text-center transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3"
          >
            <Image
              className="size-11 object-contain transition group-hover:scale-105"
              src={tab.icon}
              alt=""
              width={44}
              height={44}
              aria-hidden="true"
            />
            <span className="text-text-primary text-lg leading-[1.35] font-extrabold">
              {t(tab.title)}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="py-4">
      <div
        className={cn(
          "grid gap-4.5 max-md:gap-2.5",
          hasTwoOrFewerChoices
            ? "grid-cols-2"
            : "grid-cols-5 max-lg:grid-cols-2",
        )}
      >
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.type)}
            className={cn(
              "group bg-primary-100 py-ds-4 px-ds-5 hover:border-action-primary hover:bg-action-primary flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-0 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(31,127,250,0.18)] max-lg:flex-row max-lg:gap-2.5 max-lg:p-2.5 max-md:justify-start max-md:gap-2",
              !hasTwoOrFewerChoices && "max-lg:last:col-span-2",
            )}
          >
            <div className="icon shrink-0">
              <Image
                className="size-5 object-contain transition group-hover:brightness-0 group-hover:invert max-lg:size-7 md:size-8"
                src={tab.icon}
                alt={t(tab.title)}
                width={32}
                height={32}
              />
            </div>

            <h5 className="text-text-primary group-hover:text-text-on-action m-0 text-base font-bold transition max-md:text-sm">
              {t(tab.title)}
            </h5>
          </button>
        ))}
      </div>
    </div>
  );
}
