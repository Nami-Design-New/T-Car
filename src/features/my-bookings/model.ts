import type { StaticImageData } from 'next/image';

export type BookingStatus = 'current' | 'upcoming' | 'late' | 'completed' | 'cancelled';

export type BookingTab = 'active' | 'past';

export interface UserBooking {
  id: string;
  carName: string;
  carBrand: string;
  carImage: string | StaticImageData;
  showroom: string;
  year: number;
  rating: number;
  status: BookingStatus;
  statusLabel: string;
  dateLabel: string;
}

export interface BookingDetailsView {
  id: string;
  reference: string;
  carName: string;
  carBrand: string;
  carImage: string | StaticImageData;
  showroom: string;
  status: BookingStatus;
  statusLabel: string;
  pricePerDay: number;
  originalPrice?: number;
  pickupDateTime: string;
  dropoffDateTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  warrantyNote: string;
  pointsUsed: number;
  days: number;
  subtotal: number;
  vatRate: number;
  vat: number;
  total: number;
  bannerTimestamp?: string;
}

const ACTIVE_STATUSES: readonly BookingStatus[] = ['current', 'upcoming', 'late'];

/** Not finished yet: the customer can still edit, extend, or cancel it. */
export const isActiveBooking = (status: BookingStatus) => ACTIVE_STATUSES.includes(status);

/** The car is out with the customer, so the return countdown applies. */
export const isRentalRunning = (status: BookingStatus) => status === 'current' || status === 'late';

export function splitBookings(bookings: UserBooking[]) {
  return {
    active: bookings.filter((booking) => isActiveBooking(booking.status)),
    past: bookings.filter((booking) => !isActiveBooking(booking.status)),
  };
}
