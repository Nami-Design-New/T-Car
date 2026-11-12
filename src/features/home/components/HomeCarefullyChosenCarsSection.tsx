"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useTopLoader } from "nextjs-toploader";
import { useRouter } from "@/i18n/navigation";
import {
  CityCarBookingFlow,
  type RentalSearchOptions,
} from "@/features/rental-search";
import {
  CarsRail,
  getHomeCarefullyChosenCars,
  type CarListing,
  type CityCarsLocation,
} from "@/features/cars";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import {
  readGuestLocation,
  subscribeGuestLocation,
} from "@/shared/lib/guest-location";

interface Props {
  title: string;
  subtitle: string;
  options: RentalSearchOptions;
}

interface ListProps {
  title: string;
  subtitle: string;
  location: CityCarsLocation | null;
  onSelectCar: (car: CarListing) => void;
}

function locationFromStorage(): CityCarsLocation | null {
  const location = readGuestLocation();
  if (!location?.region) return null;
  return {
    region: location.region,
    latitude: location.lat,
    longitude: location.lng,
  };
}

function CarefullyChosenCarsList({
  title,
  subtitle,
  location,
  onSelectCar,
}: ListProps) {
  const locale = useLocale();
  const fetchPage = useCallback(
    (page: number) => getHomeCarefullyChosenCars(page, locale, location),
    [locale, location],
  );
  const cars = usePaginatedList(fetchPage, {
    scope: "home.carefullyChosenCars",
  });

  return (
    <CarsRail
      id="selected-for-you"
      title={title}
      subtitle={subtitle}
      cars={cars.items}
      seeAllHref="/cars?source=careful_chooses"
      paginated
      hasMore={cars.hasMore}
      loadingMore={cars.loading}
      loadError={cars.error ?? undefined}
      onLoadMore={cars.loadMore}
      onRetry={cars.retry}
      onSelectCar={onSelectCar}
    />
  );
}

/** Curated home cars: saved location narrows the request after hydration. */
export default function HomeCarefullyChosenCarsSection({
  title,
  subtitle,
  options,
}: Props) {
  const router = useRouter();
  const loader = useTopLoader();
  const [location, setLocation] = useState<CityCarsLocation | null | undefined>(
    undefined,
  );
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [selectionVersion, setSelectionVersion] = useState(0);

  useEffect(() => {
    const sync = () => setLocation(locationFromStorage());
    sync();
    return subscribeGuestLocation(sync);
  }, []);

  const selectCar = (car: CarListing) => {
    setSelectedCar(car);
    setSelectionVersion((version) => version + 1);
  };

  return (
    <>
      {location !== undefined && (
        <CarefullyChosenCarsList
          key={JSON.stringify(location)}
          title={title}
          subtitle={subtitle}
          location={location}
          onSelectCar={selectCar}
        />
      )}
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
