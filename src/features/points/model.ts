export type PointsTransactionType = 'earned' | 'spent' | 'expired';

export interface PointsTransaction {
  id: string;
  type: PointsTransactionType;
  amount: number;
  createdAt: string;
}

export interface PointsSummary {
  balance: number;
  expiresAt: string;
}

export interface PointsData {
  summary: PointsSummary;
  transactions: PointsTransaction[];
}

export type PointsFilter = 'all' | PointsTransactionType;
