'use server';

import { auth } from '@/auth';
import { bookingsApi } from '@/services/bookings.api';
import { AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import type { CreateBookingRequest } from './model';

/** Creates a booking after checking the session at the Server Action boundary. */
export async function createBookingAction(
  request: CreateBookingRequest
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError('unauthorized');
    await bookingsApi.createBooking(request);
    return toActionResult(ok(undefined));
  } catch (error) {
    reportError(error, { scope: 'booking.create', carId: request.carId });
    return toActionResult(fail(error));
  }
}
