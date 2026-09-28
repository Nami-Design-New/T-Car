import 'server-only';
import { carDetailsApi } from '@/services/carDetails.api';
import { toAppError } from '@/shared/lib/errors';
import type { CarDetails } from './model';

/** Null for an unknown id, so the page can call notFound(). Other failures throw to error.tsx. */
export async function getCarDetails(id: string): Promise<CarDetails | null> {
  try {
    return await carDetailsApi.getCarDetails(id);
  } catch (error) {
    const appError = toAppError(error);
    if (appError.kind === 'not_found') return null;
    throw appError;
  }
}
