import type { RentalSearchOptions } from '@/features/rental-search/model';
import { rentalSearchMock } from './mocks/rentalSearch';

export interface RentalSearchApi {
  getOptions(): Promise<RentalSearchOptions>;
}

// The search option endpoints are not available yet, so the mock is the only
// implementation. Add the http one here (see cars.api.ts) and pick between the
// two with an env flag once they exist; callers stay unchanged.
export const rentalSearchApi: RentalSearchApi = rentalSearchMock;
