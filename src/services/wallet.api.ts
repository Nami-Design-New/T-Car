import type { BankAccount } from '@/features/bank-accounts/model';
import type { WalletData, WithdrawParams } from '@/features/wallet/model';
import { walletMock } from './mocks/wallet';

export interface WalletApi {
  getWallet(): Promise<WalletData>;
  /** Same accounts the user manages from the bank accounts tab. */
  getBankAccounts(): Promise<BankAccount[]>;
  topUp(amount: number): Promise<void>;
  withdraw(params: WithdrawParams): Promise<void>;
}

// The wallet endpoints are not available yet, so the mock is the only
// implementation. Add the http one here (see cars.api.ts) and pick between the
// two with an env flag once they exist; callers stay unchanged.
export const walletApi: WalletApi = walletMock;
