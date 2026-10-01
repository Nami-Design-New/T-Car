'use client';

import Image, { StaticImageData } from 'next/image';
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
  icon: StaticImageData;
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
    <div className="rental_tabs">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.type)}
          >
            <div className="icon">
              <Image
                className="img-card"
                src={tab.icon}
                alt={t(tab.title)}
                width={44}
                height={44}
              />
            </div>

            <h5>{t(tab.title)}</h5>
          </button>
        ))}
      </div>
    </div>
  );
}
