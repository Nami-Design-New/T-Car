import type { PointsData } from '@/features/points/model';
import { AppError } from '@/shared/lib/errors';
import type { PointsApi } from '../points.api';

export const MOCK_POINTS_DATA: PointsData = {
  summary: {
    balance: 172,
    expiresAt: '2026-10-24T00:00:00.000Z',
  },
  transactions: [
    { id: 'earned-1', type: 'earned', amount: 86, createdAt: '2026-08-24T00:00:00.000Z' },
    { id: 'spent-1', type: 'spent', amount: -255, createdAt: '2026-08-24T00:00:00.000Z' },
    { id: 'expired-1', type: 'expired', amount: -331, createdAt: '2026-07-06T00:00:00.000Z' },
  ],
};

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mock only: this test id reproduces an unavailable points service response. */
const MOCK_FAILURE_USER_ID = 'points-failure';

export const pointsMock: PointsApi = {
  async getPoints(userId) {
    await delay();
    if (userId === MOCK_FAILURE_USER_ID) {
      throw new AppError('network', 'points.unavailable');
    }

    return {
      summary: { ...MOCK_POINTS_DATA.summary },
      transactions: MOCK_POINTS_DATA.transactions.map((transaction) => ({ ...transaction })),
    };
  },
};
