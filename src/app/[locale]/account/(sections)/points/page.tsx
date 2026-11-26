import { PointsPage } from '@/features/points';
import { getPoints } from '@/features/points/queries';

export default async function PointsRoute({ searchParams }: {
  searchParams: Promise<{ filter?: string | string[] }>;
}) {
  const rawFilter = (await searchParams).filter;
  const filter = rawFilter === 'earned' || rawFilter === 'spent' ? rawFilter : 'all';
  const data = await getPoints(filter);
  return <PointsPage key={filter} data={data} filter={filter} />;
}
