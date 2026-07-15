import api from './api';
import type { Car, SearchCarsParams } from '@app-types/car';

export const carsService = {

  async searchCars(params: SearchCarsParams): Promise<Car[]> {
    const { data } = await api.get<Car[]>('/cars/search', { params });
    return data;
  },

  async getCarById(id: string): Promise<Car> {
    const { data } = await api.get<Car>(`/cars/${id}`);
    return data;
  },
};
