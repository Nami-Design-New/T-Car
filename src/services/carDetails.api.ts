import type { CarDetails } from '@/features/car-details/model';
import { carDetailsMock } from './mocks/carDetails';

export interface CarDetailsApi {
  /** Throws a `not_found` AppError for an unknown id. */
  getCarDetails(id: string): Promise<CarDetails>;
}

// The car details endpoint is not available yet, so the mock is the only
// implementation. Add the http one here (see cars.api.ts) and pick between the
// two with an env flag once it exists; callers stay unchanged.
export const carDetailsApi: CarDetailsApi = carDetailsMock;
