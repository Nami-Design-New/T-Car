import type { Car, CarBrand, CarListing, Office, SearchCarsParams } from '@/features/cars/model';
import { http } from './http/client';
import { carsMock } from './mocks/cars';

export interface CarsApi {
  listCars(): Promise<CarListing[]>;
  listOffices(): Promise<Office[]>;
  listBrands(): Promise<CarBrand[]>;
}

// The listing endpoints are not available yet, so the mock is the only
// implementation. Pick between it and an http one with an env flag once they
// exist; callers stay unchanged.
export const carsApi: CarsApi = carsMock;

/**
 * The endpoints the old cars.service.ts called, unverified against the backend.
 * Not wired in yet; they are the reference for how an http implementation uses
 * the client.
 */
export const carsHttp = {
  searchCars(params: SearchCarsParams): Promise<Car[]> {
    return http.get<Car[]>('/cars/search', { query: { ...params } });
  },

  getCarById(id: string): Promise<Car> {
    return http.get<Car>(`/cars/${encodeURIComponent(id)}`);
  },
};
