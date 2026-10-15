import 'server-only';
import { cache } from 'react';
import { carDetailsApi } from '@/services/carDetails.api';
import { toAppError } from '@/shared/lib/errors';
import type { CarDetails } from './model';

/**
 * Null for an unknown id, so the page can call notFound(). Other failures throw
 * to error.tsx. Cached per request: generateMetadata and the page share one read.
 */
export const getCarDetails = cache(async (id: string): Promise<CarDetails | null> => {
  try {
    return await carDetailsApi.getCarDetails(id);
  } catch (error) {
    const appError = toAppError(error);
    if (appError.kind === 'not_found') return null;
    throw appError;
  }
});
