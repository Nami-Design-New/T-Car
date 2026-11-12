"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import { getListingCompanyCars } from "../client/carsListing.client";
import type { CarListing, OfficeCarGroup } from "../model";
import { COMPANY_CARS_PER_PAGE, type CarsListingQuery } from "../searchParams";
import CarOfficeRow from "./CarOfficeRow";

interface Props {
  group: OfficeCarGroup;
  query: CarsListingQuery;
  onSelectCar?: (car: CarListing) => void;
  showAirportPickup?: boolean;
}

/** A cars-listing company row that appends page 2 onward while it scrolls sideways. */
export default function CarsListingOfficeRow({
  group,
  query,
  onSelectCar,
  showAirportPickup = false,
}: Props) {
  const locale = useLocale();
  const fetchPage = useCallback(
    (page: number) =>
      getListingCompanyCars(group.office.id, query, page, locale),
    [group.office.id, locale, query],
  );
  const cars = usePaginatedList(fetchPage, {
    initialPage: {
      items: group.cars,
      page: 1,
      lastPage: group.cars.length >= COMPANY_CARS_PER_PAGE ? 2 : 1,
      total: group.cars.length,
    },
    scope: "carsListing.companyCars",
  });
  return (
    <CarOfficeRow
      office={group.office}
      cars={cars.items}
      hasMore={cars.hasMore}
      loadingMore={cars.loading}
      loadError={cars.error ?? undefined}
      onLoadMore={cars.loadMore}
      onRetry={cars.retry}
      onSelectCar={onSelectCar}
      showAirportPickup={showAirportPickup}
    />
  );
}
