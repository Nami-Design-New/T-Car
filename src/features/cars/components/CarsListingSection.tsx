"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import type { RentalSearchOptions } from "@/features/rental-search";
import { CityCarBookingFlow } from "@/features/rental-search";
import type { CarListing } from "../model";
import type { CarsListingQuery } from "../searchParams";
import CarsListingRows from "./CarsListingRows";

interface Props {
  query: CarsListingQuery;
  options: RentalSearchOptions;
}

/** Composes grouped listing cards with the shared booking-type flow. */
export default function CarsListingSection({ query, options }: Props) {
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const selectCar = (car: CarListing) => {
    setSelectedCar(car);
    setSelectionVersion((version) => version + 1);
  };
  return (
    <>
      <CarsListingRows query={query} onSelectCar={selectCar} />
      {selectedCar?.availability && (
        <CityCarBookingFlow
          key={selectionVersion}
          carId={selectedCar.id}
          options={options}
          availability={selectedCar.availability}
          onComplete={(carId, params) =>
            router.push(`/cars/${carId}?${params.toString()}`)
          }
        />
      )}
    </>
  );
}
