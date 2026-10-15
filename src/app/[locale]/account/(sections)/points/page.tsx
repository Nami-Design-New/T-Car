import { PointsPage } from '@/features/points';
import { getPoints } from '@/features/points/queries';

export default async function PointsRoute() {
  const data = await getPoints();
  return <PointsPage data={data} />;
}
