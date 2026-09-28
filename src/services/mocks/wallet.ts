import type { WalletSummary, WalletTransaction } from '@app-types/car';

export const MOCK_WALLET_SUMMARY: WalletSummary = {
  total: 2500,
  withdrawable: 1500,
  nonWithdrawable: 1000,
};

export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [
  { id: '1', type: 'topup', amount: 2500, reference: '7A3D6D', createdAt: '2025-12-01T04:50:00' },
  { id: '2', type: 'refund', amount: 2500, reference: '7A3D6E', createdAt: '2025-12-01T04:50:00' },
  { id: '3', type: 'payment', amount: 2500, reference: '7A3D6F', createdAt: '2025-12-01T04:50:00' },
  { id: '4', type: 'withdraw', amount: 2500, reference: '7A3D70', createdAt: '2025-12-01T04:50:00' },
];
