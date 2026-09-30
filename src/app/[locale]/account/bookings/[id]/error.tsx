'use client';

import { RouteError } from '@/shared/ui/RouteError';

export default function BookingDetailsError(props: Parameters<typeof RouteError>[0]) {
  return <RouteError {...props} scope="account.booking-details" />;
}
