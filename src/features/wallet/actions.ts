'use server';

import { auth } from '@/auth';
import type { BankAccount } from '@/features/bank-accounts/model';
import { AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import type { WalletData, WithdrawParams } from './model';

const MOCK_MAX_TOP_UP = 10000;

async function run<T>(scope: string, write: () => T): Promise<ActionResult<T>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError('unauthorized');
    return toActionResult(ok(write()));
  } catch (error) {
    reportError(error, { scope });
    return toActionResult(fail(error));
  }
}

/** Stateless mock transition; the real API will replace this when available. */
export async function topUpAction(
  amount: number,
  current: WalletData
): Promise<ActionResult<WalletData>> {
  return run('wallet.topUp', () => {
    if (amount > MOCK_MAX_TOP_UP) throw new AppError('conflict', 'wallet.topUpRejected');

    return {
      summary: {
        ...current.summary,
        total: current.summary.total + amount,
        withdrawable: current.summary.withdrawable + amount,
      },
      transactions: [
        {
          id: `action-${Date.now()}`,
          type: 'topup',
          amount,
          reference: 'ACTION',
          createdAt: new Date().toISOString(),
        },
        ...current.transactions,
      ],
    };
  });
}

export async function withdrawAction(
  params: WithdrawParams,
  current: WalletData,
  accounts: BankAccount[]
): Promise<ActionResult<WalletData>> {
  return run('wallet.withdraw', () => {
    if (!accounts.some((account) => account.id === params.bankAccountId)) {
      throw new AppError('not_found', 'bankAccounts.notFound');
    }
    if (params.amount > current.summary.withdrawable) {
      throw new AppError('conflict', 'wallet.insufficientBalance');
    }

    return {
      summary: {
        ...current.summary,
        total: current.summary.total - params.amount,
        withdrawable: current.summary.withdrawable - params.amount,
      },
      transactions: [
        {
          id: `action-${Date.now()}`,
          type: 'withdraw',
          amount: params.amount,
          reference: 'ACTION',
          createdAt: new Date().toISOString(),
        },
        ...current.transactions,
      ],
    };
  });
}
