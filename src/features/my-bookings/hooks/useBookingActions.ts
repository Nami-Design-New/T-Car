'use client';

import { useCallback, useState } from 'react';
import { bookingsApi } from '@/services/bookings.api';
import { reportError } from '@/shared/lib/report';
import { fail, ok, type Result } from '@/shared/lib/result';
import type { BookingEditRequest, BookingReviewInput } from '../model';

/** The actions a customer can take on one booking. Each resolves to a Result. */
export function useBookingActions(bookingId: string) {
  const [submitting, setSubmitting] = useState(false);

  const run = useCallback(
    async (action: () => Promise<void>): Promise<Result<void>> => {
      setSubmitting(true);
      try {
        await action();
        return ok(undefined);
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
    (days: number) => run(() => bookingsApi.extendBooking(bookingId, days)),
    [run, bookingId]
  );

  const requestEdit = useCallback(
    (request: BookingEditRequest) => run(() => bookingsApi.requestBookingEdit(bookingId, request)),
    [run, bookingId]
  );

  const cancel = useCallback(
    () => run(() => bookingsApi.cancelBooking(bookingId)),
    [run, bookingId]
  );

  const review = useCallback(
    (input: BookingReviewInput) => run(() => bookingsApi.submitReview(bookingId, input)),
    [run, bookingId]
  );

  return { submitting, extend, requestEdit, cancel, review };
}
