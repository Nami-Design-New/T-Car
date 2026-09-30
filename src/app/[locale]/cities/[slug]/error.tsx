'use client';

import { RouteError } from '@/shared/ui/RouteError';

export default function CityDetailsError(props: Parameters<typeof RouteError>[0]) {
  return <RouteError {...props} scope="cities.details" />;
}
