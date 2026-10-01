import 'server-only';
import { carsApi } from '@/services/cars.api';
import {
  groupCarsByOffice,
  selectHandpickedCars,
  selectOfferCars,
  type CarListing,
  type OfficeCarGroup,
} from './model';
import { filterAndSortCars, filterOfficeGroups, type CarSearchParams } from './searchParams';

export async function getOfficeCarGroups(params?: CarSearchParams): Promise<OfficeCarGroup[]> {
  const [offices, cars] = await Promise.all([carsApi.listOffices(), carsApi.listCars()]);
  const groups = groupCarsByOffice(offices, cars);
  return params ? filterOfficeGroups(groups, params) : groups;
}

/** The mock cars have no city yet, so every city lists all cars. */
export async function getCarsForCity(_slug: string, params?: CarSearchParams): Promise<CarListing[]> {
  const cars = await carsApi.listCars();
  return params ? filterAndSortCars(cars, params) : cars;
}

export async function getOfferCars(): Promise<CarListing[]> {
  return selectOfferCars(await carsApi.listCars());
}

export async function getHandpickedCars(): Promise<CarListing[]> {
  return selectHandpickedCars(await carsApi.listCars());
}

export async function getOffices() {
  return carsApi.listOffices();
}
