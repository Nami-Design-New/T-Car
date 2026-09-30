'use client';

import { RouteError } from '@/shared/ui/RouteError';

export default function CarDetailsError(props: Parameters<typeof RouteError>[0]) {
  return <RouteError {...props} scope="cars.details" />;
}
