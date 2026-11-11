"use client";

import { useCallback, useState } from "react";
import {
  fail,
  fromActionResult,
  type ActionResult,
  type Result,
} from "@/shared/lib/result";
import { reportError } from "@/shared/lib/report";
import {
  cancelBookingAction,
  extendBookingAction,
  getCancelQuoteAction,
  requestModificationAction,
  requestBookingEditAction,
  submitBookingReviewAction,
  type BookingEditRequest,
  type BookingReviewInput,
  type CancelQuote,
  type ModificationQuote,
  type ModificationRequest,
} from "@/features/orders";

/** Booking writes cross authenticated Server Actions and resolve to a Result. */
export function useBookingActions(bookingId: string) {
  const [submitting, setSubmitting] = useState(false);

  const run = useCallback(
    async <T>(
      action: () => Promise<ActionResult<T>>,
      trackSubmitting = true,
    ): Promise<Result<T>> => {
      if (trackSubmitting) setSubmitting(true);
      try {
        return fromActionResult(await action());
      } catch (error) {
        reportError(error, { scope: "bookings.action", bookingId });
        return fail(error);
      } finally {
        if (trackSubmitting) setSubmitting(false);
      }
    },
    [bookingId],
  );

  const extend = useCallback(
    (days: number) => run(() => extendBookingAction(bookingId, days)),
    [run, bookingId],
  );

  const requestEdit = useCallback(
    (request: BookingEditRequest) =>
      run(() => requestBookingEditAction(bookingId, request)),
    [run, bookingId],
  );

  const modify = useCallback(
    (request: ModificationRequest): Promise<Result<ModificationQuote>> =>
      run(() => requestModificationAction(bookingId, request), request.store),
    [run, bookingId],
  );

  const cancel = useCallback(
    () => run(() => cancelBookingAction(bookingId)),
    [run, bookingId],
  );

  const getCancelQuote = useCallback(async (): Promise<Result<CancelQuote>> => {
    setSubmitting(true);
    try {
      return fromActionResult(await getCancelQuoteAction(bookingId));
    } catch (error) {
      reportError(error, { scope: "bookings.cancelQuote", bookingId });
      return fail(error);
    } finally {
      setSubmitting(false);
    }
  }, [bookingId]);

  const review = useCallback(
    (input: BookingReviewInput) =>
      run(() => submitBookingReviewAction(bookingId, input)),
    [run, bookingId],
  );

  return {
    submitting,
    extend,
    requestEdit,
    modify,
    getCancelQuote,
    cancel,
    review,
  };
}
