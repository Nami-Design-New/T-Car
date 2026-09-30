import { PageSkeleton } from '@/shared/ui/Skeleton';

// The home page only; the (home) group keeps it off every other route.
export default function Loading() {
  return <PageSkeleton />;
}
