import "server-only";
import { getLocale } from "next-intl/server";
import { carsApi } from "@/services/cars.api";
import type { Page } from "@/shared/lib/pagination";
import { cityCarsApi } from "./api";
import {
  groupCarsByOffice,
  selectHandpickedCars,
  type CarBrand,
  type CityCarFilterOptions,
  type CarListing,
  type OfficeCarGroup,
} from "./model";
import {
  filterAndSortCars,
  filterOfficeGroups,
  type CityCarsQuery,
  type CarSearchParams,
} from "./searchParams";

export async function getOfficeCarGroups(
  params?: CarSearchParams,
): Promise<OfficeCarGroup[]> {
  const [offices, cars] = await Promise.all([
    carsApi.listOffices(),
    carsApi.listCars(),
  ]);
  const groups = groupCarsByOffice(offices, cars);
  return params ? filterOfficeGroups(groups, params) : groups;
}

/** The mock cars have no city yet, so every city lists all cars. */
export async function getCarsForCity(
  _slug: string,
  params?: CarSearchParams,
): Promise<CarListing[]> {
  const cars = await carsApi.listCars();
  return params ? filterAndSortCars(cars, params) : cars;
}

/**
 * The city page's first page of company rows (GET /city-cars); the client
 * loads the next pages through `getCityCarGroupsAction`.
 */
export async function getCityCarGroups(
  query: CityCarsQuery,
): Promise<Page<OfficeCarGroup>> {
  return cityCarsApi.listCityCars(await getLocale(), query, 1);
}

export async function getHandpickedCars(): Promise<CarListing[]> {
  return selectHandpickedCars(await carsApi.listCars());
}

export async function getOffices() {
  return carsApi.listOffices();
}

/** Brand options for the cars and city filters. */
export async function getCarBrands(): Promise<CarBrand[]> {
  return carsApi.listBrands();
}

/** Live lookup values used by the city-car filter surface. */
export async function getCityCarFilterOptions(): Promise<CityCarFilterOptions> {
  return cityCarsApi.getFilterOptions(await getLocale());
}
