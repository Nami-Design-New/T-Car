"use client";

import { useState } from "react";
import { useTopLoader } from "nextjs-toploader";
import { useRouter } from "@/i18n/navigation";
import {
  CityCarRows,
  type CarListing,
  type CityCarsQuery,
} from "@/features/cars";
import {
  CityCarBookingFlow,
  type RentalSearchOptions,
} from "@/features/rental-search";

interface Props {
  query: CityCarsQuery;
  cityName: string;
  options: RentalSearchOptions;
}

/** Composes a city car selection with the shared rental search flow. */
export default function CityCarsSection({ query, cityName, options }: Props) {
  const router = useRouter();
  const loader = useTopLoader();
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const selectCar = (car: CarListing) => {
    setSelectedCar(car);
    setSelectionVersion((version) => version + 1);
  };

  return (
    <>
      <CityCarRows query={query} cityName={cityName} onSelectCar={selectCar} />
      {selectedCar?.availability && (
        <CityCarBookingFlow
          key={selectionVersion}
          carId={selectedCar.id}
          options={options}
          availability={selectedCar.availability}
          onComplete={(carId, params) => {
            loader.start();
            router.push(`/cars/${carId}?${params.toString()}`);
          }}
        />
      )}
    </>
  );
}
