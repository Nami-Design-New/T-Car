'use server';

import { auth } from '@/auth';
import { bookingsApi } from '@/services/bookings.api';
import { AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import { toValidationError } from '@/shared/lib/validation';
import type { BookingEditRequest, BookingReviewInput } from './model';
import { bookingEditSchema, bookingReviewSchema, extendBookingSchema } from './validation';
import type { ZodType } from 'zod';

function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}

async function run(scope: string, write: () => Promise<void>): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError('unauthorized');
    await write();
    return toActionResult(ok(undefined));
  } catch (error) {
    reportError(error, { scope });
    return toActionResult(fail(error));
  }
}

export async function extendBookingAction(
  bookingId: string,
  days: number
): Promise<ActionResult<void>> {
  return run('bookings.extend', () => {
    const values = parse(extendBookingSchema, { days });
    return bookingsApi.extendBooking(bookingId, values.days);
  });
}

export async function requestBookingEditAction(
  bookingId: string,
  request: BookingEditRequest
): Promise<ActionResult<void>> {
  return run('bookings.requestEdit', () => {
    const values = parse(bookingEditSchema, request);
    return bookingsApi.requestBookingEdit(bookingId, values);
  });
}

export async function cancelBookingAction(bookingId: string): Promise<ActionResult<void>> {
  return run('bookings.cancel', () => bookingsApi.cancelBooking(bookingId));
}

export async function submitBookingReviewAction(
  bookingId: string,
  input: BookingReviewInput
): Promise<ActionResult<void>> {
  return run('bookings.review', () => {
    const values = parse(bookingReviewSchema, input);
    return bookingsApi.submitReview(bookingId, values);
  });
}
