'use client';

import { useCallback, useState } from 'react';
import { bookingsApi } from '@/services/bookings.api';
import { reportError } from '@/shared/lib/report';
import { fail, ok, type Result } from '@/shared/lib/result';
import type { BookingDetails, PaymentMethod } from '../model';

/** Books one car. `createBooking` resolves to a Result. */
export function useCreateBooking(carId: string) {
  const [submitting, setSubmitting] = useState(false);

  const createBooking = useCallback(
    async (details: BookingDetails, paymentMethod: PaymentMethod): Promise<Result<void>> => {
      setSubmitting(true);
      try {
        await bookingsApi.createBooking({ carId, details, paymentMethod });
        return ok(undefined);
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
