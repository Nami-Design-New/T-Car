import type { Bank, BankAccount, BankAccountPayload } from '@/features/bank-accounts/model';
import { bankAccountsMock } from './mocks/bankAccounts';

export interface BankAccountsApi {
  getBanks(): Promise<Bank[]>;
  getBankAccounts(): Promise<BankAccount[]>;
  addBankAccount(payload: BankAccountPayload): Promise<void>;
  updateBankAccount(id: string, payload: BankAccountPayload): Promise<void>;
  deleteBankAccount(id: string): Promise<void>;
}

// The bank account endpoints are not available yet, so the mock is the only
// implementation. Add the http one here (see cars.api.ts) and pick between the
// two with an env flag once they exist; callers stay unchanged.
export const bankAccountsApi: BankAccountsApi = bankAccountsMock;
