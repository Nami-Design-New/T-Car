"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import type { RentalSearchOptions } from "@/features/rental-search";
import {
  carSupportsRentalContext,
  CityCarBookingFlow,
  readRentalContext,
  rentalContextParams,
} from "@/features/rental-search";
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
  // Set when the visitor reached /cars through the rental tabs flow.
  const rentalContext = readRentalContext(useSearchParams());
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const selectCar = (car: CarListing) => {
    // The flow already ran: go straight to the details with the same choice,
    // unless this car does not offer it (then the flow asks again).
    if (
      rentalContext &&
      car.availability &&
      carSupportsRentalContext(car.availability, rentalContext)
    ) {
      router.push(
        `/cars/${car.id}?${rentalContextParams(rentalContext).toString()}`,
      );
      return;
    }
    setSelectedCar(car);
    setSelectionVersion((version) => version + 1);
  };
  return (
    <>
      <CarsListingRows
        query={query}
        onSelectCar={selectCar}
        showAirportPickup={rentalContext?.type === "airport"}
      />
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
