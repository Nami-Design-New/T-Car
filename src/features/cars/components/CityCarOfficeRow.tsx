"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import { getCompanyCars } from "../cityCars.client";
import type { OfficeCarGroup } from "../model";
import { COMPANY_CARS_PER_PAGE, type CityCarsQuery } from "../searchParams";
import CarOfficeRow from "./CarOfficeRow";

interface Props {
  group: OfficeCarGroup;
  query: CityCarsQuery;
}

/**
 * A city company row that scrolls sideways into more cars. The group's cars
 * are page 1 of GET /city-company-cars; a full group may have a page 2, which
 * loads when the row reaches its end.
 */
export default function CityCarOfficeRow({ group, query }: Props) {
  const companyId = group.office.id;
  const locale = useLocale();
  const fetchPage = useCallback(
    (page: number) => getCompanyCars(companyId, query, page, locale),
    [companyId, locale, query],
  );
  const cars = usePaginatedList(fetchPage, {
    initialPage: {
      items: group.cars,
      page: 1,
      // The group does not say how many cars the company has: a full one
      // may have more, and page 2 answers with the real last page.
      lastPage: group.cars.length >= COMPANY_CARS_PER_PAGE ? 2 : 1,
      total: group.cars.length,
    },
    scope: "cityCars.companyCars",
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
    />
  );
}
