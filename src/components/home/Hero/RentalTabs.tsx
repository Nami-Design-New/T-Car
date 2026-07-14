'use client';

import Image, { StaticImageData } from 'next/image';

import dailyIcon from '../../../assets/icons/daily.svg';
import monthlyIcon from '../../../assets/icons/monthly.svg';
import airportIcon from '../../../assets/icons/airport.svg';
import stationIcon from '../../../assets/icons/station.svg';
import internationalIcon from '../../../assets/icons/international.svg';

import {
  RentalTabsProps,
  RentalType,
} from '@/types/car';

const tabs: {
  id: RentalType;
  title: string;
  icon: StaticImageData;
}[] = [
  {
    id: 'daily',
    title: 'يومي',
    icon: dailyIcon,
  },
  {
    id: 'monthly',
    title: 'شهري',
    icon: monthlyIcon,
  },
  {
    id: 'airport',
    title: 'من المطار',
    icon: airportIcon,
  },
  {
    id: 'station',
    title: 'محطة قطار',
    icon: stationIcon,
  },
  {
    id: 'international',
    title: 'التأجير الدولي',
    icon: internationalIcon,
  },
];

export default function RentalTabs({
  onSelect,
}: RentalTabsProps) {
  return (
    <div className="rental_tabs">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
          >
            <div className="icon">
              <Image
              className='img-card'
                src={tab.icon}
                alt={tab.title}
                width={44}
                height={44}
              />
            </div>

            <h5>{tab.title}</h5>
          </button>
        ))}
      </div>
    </div>
  );
}