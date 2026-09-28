import 'server-only';
import { carsApi } from '@/services/cars.api';
import {
  groupCarsByOffice,
  selectHandpickedCars,
  selectOfferCars,
  type CarListing,
  type OfficeCarGroup,
} from './model';

export async function getOfficeCarGroups(): Promise<OfficeCarGroup[]> {
  const [offices, cars] = await Promise.all([carsApi.listOffices(), carsApi.listCars()]);
  return groupCarsByOffice(offices, cars);
}

/** The mock cars have no city yet, so every city lists all cars. */
export function getCarsForCity(_slug: string): Promise<CarListing[]> {
  return carsApi.listCars();
}

export async function getOfferCars(): Promise<CarListing[]> {
  return selectOfferCars(await carsApi.listCars());
}

export async function getHandpickedCars(): Promise<CarListing[]> {
  return selectHandpickedCars(await carsApi.listCars());
}
