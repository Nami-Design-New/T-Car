"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  readGuestLocation,
  subscribeGuestLocation,
} from "@/shared/lib/guest-location";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InfiniteList } from "@/shared/ui/InfiniteList";
import { getCarsListingGroups } from "../client/carsListing.client";
import type { CarListing, OfficeCarGroup } from "../model";
import {
  withCityCarsLocation,
  type CarsListingQuery,
  type CityCarsLocation,
} from "../searchParams";
import CarOfficeRowSkeleton from "./CarOfficeRowSkeleton";
import CarsListingOfficeRow from "./CarsListingOfficeRow";

interface Props {
  query: CarsListingQuery;
  onSelectCar?: (car: CarListing) => void;
  showAirportPickup?: boolean;
}
interface ListProps extends Props {
  onSelectCar: (car: CarListing) => void;
}

function locationFromStorage(): CityCarsLocation | null {
  const location = readGuestLocation();
  return location?.region
    ? {
        region: location.region,
        latitude: location.lat,
        longitude: location.lng,
      }
    : null;
}

function Rows({ query, onSelectCar, showAirportPickup }: ListProps) {
  const t = useTranslations("carsPage");
  const locale = useLocale();
  const fetchPage = useCallback(
    (page: number) => getCarsListingGroups(query, page, locale),
    [locale, query],
  );
  const groups = usePaginatedList<OfficeCarGroup>(fetchPage, {
    scope: "carsListing.groups",
  });
  return (
    <InfiniteList
      loading={groups.loading}
      hasMore={groups.hasMore}
      isEmpty={groups.items.length === 0}
      error={groups.error ?? undefined}
      onLoadMore={groups.loadMore}
      onRetry={groups.retry}
      className="flex min-w-0 flex-col gap-3"
    >
      <InfiniteList.Items className="flex flex-col gap-3">
        {groups.items.map((group) => (
          <InfiniteList.Item key={group.office.id} className="min-w-0">
            <CarsListingOfficeRow
              group={group}
              query={query}
              showAirportPickup={showAirportPickup}
              onSelectCar={(car) => car.availability && onSelectCar(car)}
            />
          </InfiniteList.Item>
        ))}
      </InfiniteList.Items>
      <InfiniteList.Loading count={2} className="flex flex-col gap-3">
        <CarOfficeRowSkeleton />
      </InfiniteList.Loading>
      <InfiniteList.Error />
      <InfiniteList.Empty>
        <EmptyState title={t("empty")} illustration="notFound" />
      </InfiniteList.Empty>
    </InfiniteList>
  );
}

/** Adds the guest's browser-only saved location before requesting listing rows. */
export default function CarsListingRows({
  query,
  onSelectCar,
  showAirportPickup,
}: Props) {
  const [location, setLocation] = useState<CityCarsLocation | null | undefined>(
    undefined,
  );
  useEffect(() => {
    const sync = () => setLocation(locationFromStorage());
    sync();
    return subscribeGuestLocation(sync);
  }, []);
  if (location === undefined) return <CarOfficeRowSkeleton />;
  const locationQuery = {
    ...withCityCarsLocation(query, location),
    source: query.source,
  } as CarsListingQuery;
  return (
    <Rows
      key={JSON.stringify(locationQuery)}
      query={locationQuery}
      showAirportPickup={showAirportPickup}
      onSelectCar={onSelectCar ?? (() => undefined)}
    />
  );
}
