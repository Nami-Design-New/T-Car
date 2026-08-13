'use client';

import Image, { StaticImageData } from 'next/image';
import { useTranslation } from 'react-i18next';

import dailyIcon from '../../../assets/icons/dailytab.svg';
import monthlyIcon from '../../../assets/icons/monthlytab.svg';
import airportIcon from '../../../assets/icons/airport.svg';
import stationIcon from '../../../assets/icons/stationtab.svg';
import internationalIcon from '../../../assets/icons/international.svg';

import {
  RentalTabsProps,
  RentalType,
} from '@/types/car';

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
}: RentalTabsProps) {
  const { t } = useTranslation();

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
