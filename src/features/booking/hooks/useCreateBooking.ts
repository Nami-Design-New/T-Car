'use client';

import { useCallback, useState } from 'react';
import { fail, fromActionResult, type Result } from '@/shared/lib/result';
import { reportError } from '@/shared/lib/report';
import { createBookingAction } from '../actions';
import type { BookingDetails, PaymentMethod } from '../model';

/** Books one car through the authenticated checkout Server Action. */
export function useCreateBooking(carId: string) {
  const [submitting, setSubmitting] = useState(false);

  const createBooking = useCallback(
    async (
      details: BookingDetails,
      paymentMethod: PaymentMethod,
      termsAccepted: boolean
    ): Promise<Result<void>> => {
      setSubmitting(true);
      try {
        return fromActionResult(await createBookingAction({ carId, details, paymentMethod, termsAccepted }));
      } catch (error) {
        reportError(error, { scope: 'booking.create', carId });
        return fail(error);
      } finally {
        setSubmitting(false);
      }
    },
    [carId]
  );

  return { submitting, createBooking };
}
