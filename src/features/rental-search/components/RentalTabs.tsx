'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';;

import { RENTAL_ICONS } from '@/shared/config/assets';
const dailyIcon = RENTAL_ICONS.daily;
const monthlyIcon = RENTAL_ICONS.monthly;
const airportIcon = RENTAL_ICONS.airport;
const stationIcon = RENTAL_ICONS.station;
const internationalIcon = RENTAL_ICONS.international;

import type { RentalType } from '../model';

interface Props {
  onSelect: (type: RentalType) => void;
}

const tabs: {
  id: RentalType;
  title: string;
  icon: { src: string; width: number; height: number };
  type: RentalType;
}[] = [
  {
    id: 'daily',
    title: 'rentalTabs.daily',
    icon: dailyIcon,
    type:'daily',
  },
  {
    id: 'monthly',
    title: 'rentalTabs.monthly',
    icon: monthlyIcon,
    type:'monthly',
  },
  {
    id: 'airport',
    title: 'rentalTabs.airport',
    icon: airportIcon,
    type:'airport',
  },
  {
    id: 'station',
    title: 'rentalTabs.station',
    icon: stationIcon,
    type:'station',
  },
  {
    id: 'international',
    title: 'rentalTabs.international',
    icon: internationalIcon,
    type:'international',
  },
];


export default function RentalTabs({
  onSelect,
}: Props) {
  const t = useTranslations();


  return (
    <div className="rental_tabs rounded-2xl bg-surface-elevated p-6 shadow-[0_18px_45px_rgba(30,30,30,0.12)]">
      <div className="tabs grid grid-cols-5 gap-[18px] max-lg:grid-cols-2 max-sm:grid-cols-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.type)}
            className="group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-stroke-light bg-surface-elevated p-5 transition duration-300 hover:-translate-y-1.5 hover:border-action-primary hover:bg-action-primary hover:shadow-[0_15px_35px_rgba(31,127,250,0.18)] max-lg:flex-row max-lg:gap-2.5 max-lg:p-2.5 max-md:justify-start"
          >
            <div className="icon shrink-0">
              <Image
                className="img-card size-11 object-contain transition group-hover:brightness-0 group-hover:invert max-lg:size-7"
                src={tab.icon}
                alt={t(tab.title)}
                width={44}
                height={44}
              />
            </div>

            <h5 className="m-0 text-base font-bold text-text-primary transition group-hover:text-text-on-action">{t(tab.title)}</h5>
          </button>
        ))}
      </div>
    </div>
  );
}
