import type { LocationData } from '@app-types/car';

export type PaymentMethod = 'wallet' | 'visa' | 'tabby' | 'tamara';

/** What the daily booking form produces: dates, time, places, and the price. */
export interface BookingDetails {
  startDate: Date;
  endDate: Date;
  time: string;
  days: number;
  pricePerDay: number;
  subtotal: number;
  vat: number;
  total: number;
  notes: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupLocation?: LocationData | null;
  dropoffLocation?: LocationData | null;
}

export interface CreateBookingRequest {
  carId: string;
  details: BookingDetails;
  paymentMethod: PaymentMethod;
}
