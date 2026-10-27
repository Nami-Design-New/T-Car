import 'server-only';

import { auth } from '@/auth';
import type { PointsData } from './model';
import { pointsApi } from '@/services/points.api';
import { protectedRead } from '@/services/http/session';
import { AppError } from '@/shared/lib/errors';

export function getPoints(): Promise<PointsData> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError('unauthorized');

    return pointsApi.getPoints(session.user.id);
  });
}
