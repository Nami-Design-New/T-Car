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
import { getCityCarGroups } from "../cityCars.client";
import type { OfficeCarGroup } from "../model";
import {
  withCityCarsLocation,
  type CityCarsLocation,
  type CityCarsQuery,
} from "../searchParams";
import CarOfficeRowSkeleton from "./CarOfficeRowSkeleton";
import CityCarOfficeRow from "./CityCarOfficeRow";

interface Props {
  /** Server-safe filters; saved browser location is added after hydration. */
  query: CityCarsQuery;
  cityName: string;
}

function CityCarRowsList({ query, cityName }: Props) {
  const t = useTranslations("cities.empty");
  const locale = useLocale();
  const fetchPage = useCallback(
    (page: number) => getCityCarGroups(query, page, locale),
    [locale, query],
  );
  const groups = usePaginatedList<OfficeCarGroup>(fetchPage, {
    scope: "cityCars.groups",
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
            <CityCarOfficeRow group={group} query={query} />
          </InfiniteList.Item>
        ))}
      </InfiniteList.Items>
      <InfiniteList.Loading count={2} className="flex flex-col gap-3">
        <CarOfficeRowSkeleton />
      </InfiniteList.Loading>
      <InfiniteList.Error />
      <InfiniteList.Empty>
        <EmptyState
          title={t("title", { city: cityName })}
          description={t("description")}
        />
      </InfiniteList.Empty>
    </InfiniteList>
  );
}

/**
 * Browser location is deliberately read after hydration. This keeps it out of
 * server HTML and shows the city-row skeleton while the first request loads.
 */
export default function CityCarRows({ query, cityName }: Props) {
  const [location, setLocation] = useState<CityCarsLocation | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const sync = () => {
      const saved = readGuestLocation();
      setLocation(
        saved && saved.region
          ? {
              region: saved.region,
              latitude: saved.lat,
              longitude: saved.lng,
            }
          : null,
      );
    };
    sync();
    return subscribeGuestLocation(sync);
  }, []);

  if (location === undefined) return <CarOfficeRowSkeleton />;

  const locationQuery = withCityCarsLocation(query, location);
  return (
    <CityCarRowsList
      key={JSON.stringify(locationQuery)}
      query={locationQuery}
      cityName={cityName}
    />
  );
}
