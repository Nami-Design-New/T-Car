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
  getHomeOfferCars,
  type CarListing,
  type CityCarsLocation,
} from "@/features/cars";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import {
  readCurrentLocation,
  subscribeCurrentLocation,
} from "@/features/location";

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

function currentRequestLocation(): CityCarsLocation | null {
  const location = readCurrentLocation();
  if (!location?.region) return null;
  return {
    region: location.region,
    latitude: location.lat,
    longitude: location.lng,
  };
}

function HomeOffersList({ title, subtitle, location, onSelectCar }: ListProps) {
  const locale = useLocale();
  const fetchPage = useCallback(
    (page: number) => getHomeOfferCars(page, locale, location),
    [locale, location],
  );
  const offers = usePaginatedList(fetchPage, {
    scope: "home.offerCars",
  });

  return (
    <CarsRail
      id="offers"
      title={title}
      subtitle={subtitle}
      cars={offers.items}
      seeAllHref="/cars?source=offers"
      paginated
      hasMore={offers.hasMore}
      loadingMore={offers.loading}
      loadError={offers.error ?? undefined}
      onLoadMore={offers.loadMore}
      onRetry={offers.retry}
      onSelectCar={onSelectCar}
    />
  );
}

/** Home offers: the current location narrows the request after hydration. */
export default function HomeOffersSection({ title, subtitle, options }: Props) {
  const router = useRouter();
  const loader = useTopLoader();
  const [location, setLocation] = useState<CityCarsLocation | null | undefined>(
    undefined,
  );
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [selectionVersion, setSelectionVersion] = useState(0);

  useEffect(() => {
    const sync = () => setLocation(currentRequestLocation());
    sync();
    return subscribeCurrentLocation(sync);
  }, []);

  const selectCar = (car: CarListing) => {
    setSelectedCar(car);
    setSelectionVersion((version) => version + 1);
  };

  return (
    <>
      {location !== undefined && (
        <HomeOffersList
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
