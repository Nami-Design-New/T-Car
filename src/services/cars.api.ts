import type { Car, SearchCarsParams } from '@/types/car';
import { http } from './http/client';

export const carsApi = {
  searchCars(params: SearchCarsParams): Promise<Car[]> {
    return http.get<Car[]>('/cars/search', { query: { ...params } });
  },

  getCarById(id: string): Promise<Car> {
    return http.get<Car>(`/cars/${encodeURIComponent(id)}`);
  },
};
