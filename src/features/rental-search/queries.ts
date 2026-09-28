import 'server-only';
import { rentalSearchApi } from '@/services/rentalSearch.api';
import type { RentalSearchOptions } from './model';

export function getRentalSearchOptions(): Promise<RentalSearchOptions> {
  return rentalSearchApi.getOptions();
}
