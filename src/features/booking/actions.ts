'use server';

import { auth } from '@/auth';
import { bookingsApi } from '@/services/bookings.api';
import { AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import { toValidationError } from '@/shared/lib/validation';
import type { ZodType } from 'zod';
import type { CreateBookingRequest } from './model';
import { createBookingSchema } from './validation';

function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}

/** Creates a booking after checking the session at the Server Action boundary. */
export async function createBookingAction(
  request: CreateBookingRequest
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError('unauthorized');
    await bookingsApi.createBooking(parse(createBookingSchema, request));
    return toActionResult(ok(undefined));
  } catch (error) {
    reportError(error, { scope: 'booking.create', carId: request.carId });
    return toActionResult(fail(error));
  }
}
