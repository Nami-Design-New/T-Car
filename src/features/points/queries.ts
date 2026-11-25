import 'server-only';

import { auth } from '@/auth';
import type { PointsData, PointsFilter, PointsSummary } from './model';
import { pointsApi } from './api';
import { protectedRead } from '@/services/http/session';
import { AppError } from '@/shared/lib/errors';

export function getPoints(filter: PointsFilter = 'all'): Promise<PointsData> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError('unauthorized');

    return pointsApi.getPoints(session.user.id, 1, filter);
  });
}

export function getPointsSummary(): Promise<PointsSummary> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError('unauthorized');

    return pointsApi.getSummary(session.user.id);
  });
}
