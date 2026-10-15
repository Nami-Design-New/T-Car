import { PageSkeleton } from '@/shared/ui/Skeleton';

// Inside the account layout: the title and section links stay while a section loads.
export default function Loading() {
  return <PageSkeleton variant="section" />;
}
