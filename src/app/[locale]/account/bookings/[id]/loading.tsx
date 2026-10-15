import { PageSkeleton } from '@/shared/ui/Skeleton';

// Keep the account shell and shared site chrome visible while the resource loads.
export default function Loading() {
  return <PageSkeleton />;
}
