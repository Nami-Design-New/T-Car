import 'server-only';

import { auth } from '@/auth';
import type { PointsData } from './model';
import { pointsApi } from '@/services/points.api';
import { AppError } from '@/shared/lib/errors';

export async function getPoints(): Promise<PointsData> {
  const session = await auth();
  if (!session?.user?.id) throw new AppError('unauthorized');

  return pointsApi.getPoints(session.user.id);
}
