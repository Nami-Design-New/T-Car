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

/** Home offers: saved location narrows the request after hydration. */
export default function HomeOffersSection({ title, subtitle, options }: Props) {
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
