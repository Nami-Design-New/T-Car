import type { PointsData } from '@/features/points/model';
import { pointsMock } from './mocks/points';

export interface PointsApi {
  getPoints(userId: string): Promise<PointsData>;
}

// The points endpoint is not available yet, so keep the mock behind this
// interface until the backend contract is agreed.
export const pointsApi: PointsApi = pointsMock;
