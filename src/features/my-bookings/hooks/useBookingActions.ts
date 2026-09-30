'use client';

import { useCallback, useState } from 'react';
import { fail, fromActionResult, type Result } from '@/shared/lib/result';
import { reportError } from '@/shared/lib/report';
import {
  cancelBookingAction,
  extendBookingAction,
  requestBookingEditAction,
  submitBookingReviewAction,
} from '../actions';
import type { BookingEditRequest, BookingReviewInput } from '../model';

/** Booking writes cross authenticated Server Actions and resolve to a Result. */
export function useBookingActions(bookingId: string) {
  const [submitting, setSubmitting] = useState(false);

  const run = useCallback(
    async (action: () => Promise<Awaited<ReturnType<typeof extendBookingAction>>>): Promise<Result<void>> => {
      setSubmitting(true);
      try {
        return fromActionResult(await action());
      } catch (error) {
        reportError(error, { scope: 'bookings.action', bookingId });
        return fail(error);
      } finally {
        setSubmitting(false);
      }
    },
    [bookingId]
  );

  const extend = useCallback(
    (days: number) => run(() => extendBookingAction(bookingId, days)),
    [run, bookingId]
  );

  const requestEdit = useCallback(
    (request: BookingEditRequest) => run(() => requestBookingEditAction(bookingId, request)),
    [run, bookingId]
  );

  const cancel = useCallback(
    () => run(() => cancelBookingAction(bookingId)),
    [run, bookingId]
  );

  const review = useCallback(
    (input: BookingReviewInput) => run(() => submitBookingReviewAction(bookingId, input)),
    [run, bookingId]
  );

  return { submitting, extend, requestEdit, cancel, review };
}
