'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import type { CityDetails } from '@app-types/car';
import DateTimePicker from '@components/common/DateTimePicker';
import { FiCalendar, FiSearch } from "react-icons/fi";
interface Props {
  city: CityDetails;
}

export default function CityHero({ city }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pickup, setPickup] = useState({
    date: searchParams.get('pickupDate') ?? '',
    time: searchParams.get('pickupTime') ?? '',
  });
  const [dropoff, setDropoff] = useState({
    date: searchParams.get('dropoffDate') ?? '',
    time: searchParams.get('dropoffTime') ?? '',
  });

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (pickup.date) params.set('pickupDate', pickup.date);
    if (pickup.time) params.set('pickupTime', pickup.time);
    if (dropoff.date) params.set('dropoffDate', dropoff.date);
    if (dropoff.time) params.set('dropoffTime', dropoff.time);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="city-hero">
        <Image
          src={city.heroImage}
          alt={city.name}
          fill
          priority
          sizes="100vw"
          className="city-hero-image"
        />
        <div className="city-hero-scrim" />

        <div className="container-tcar city-hero-content">
          <h1>تأجير سيارات {city.name}</h1>
          <p>تأجير سيارات المدينة الآن سهل مع تكلفي، خدمة مميزة وسرعة في التأجير</p>
        </div>
      </div>

      <div className="container-tcar">
     <div className="city-search-card">

  <div className="city-search-card-field">
    <div className="field-icon">
      <FiCalendar />
    </div>

    <DateTimePicker
      label="الاستلام"
      value={pickup}
      onChange={setPickup}
      placeholder="اختر تاريخ الاستلام"
    />
  </div>

  <div className="city-search-card-divider" />

  <div className="city-search-card-field">
    <div className="field-icon">
      <FiCalendar />
    </div>

    <DateTimePicker
      label="التسليم"
      value={dropoff}
      onChange={setDropoff}
      minDate={pickup.date || undefined}
      placeholder="اختر تاريخ التسليم"
    />
  </div>

  <button
    className="city-search-card-btn"
    onClick={handleSearch}
  >
    <FiSearch />
    بحث
  </button>

</div>
      </div>
    </>
  );
}