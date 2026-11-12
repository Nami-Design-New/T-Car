"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
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
  const loader = useTopLoader();
  const searchParams = useSearchParams();
  // The hero has already collected the user's search input. Selecting a car
  // from that result should always go straight to its details page.
  const fromHero = searchParams.get("entry") === "hero";
  // Set when the visitor reached /cars through the rental tabs flow.
  const rentalContext = readRentalContext(searchParams);
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const selectCar = (car: CarListing) => {
    if (fromHero) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("entry");
      const query = params.toString();
      loader.start();
      router.push(`/cars/${car.id}${query ? `?${query}` : ""}`);
      return;
    }

    // The flow already ran: go straight to the details with the same choice,
    // unless this car does not offer it (then the flow asks again).
    if (
      rentalContext &&
      car.availability &&
      carSupportsRentalContext(car.availability, rentalContext)
    ) {
      loader.start();
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
          onComplete={(carId, params) => {
            loader.start();
            router.push(`/cars/${carId}?${params.toString()}`);
          }}
        />
      )}
    </>
  );
}
