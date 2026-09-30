'use server';

import { auth } from '@/auth';
import { MOCK_BANKS } from '@/services/mocks/bankAccounts';
import { AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import { maskIban, normalizeIban, type BankAccount, type BankAccountPayload } from './model';

function toAccount(id: string, payload: BankAccountPayload): BankAccount {
  const bank = MOCK_BANKS.find((item) => item.id === payload.bankId);
  if (!bank) throw new AppError('validation', 'bankAccounts.unknownBank');

  const iban = normalizeIban(payload.iban);
  if (!iban) throw new AppError('validation', 'bankAccounts.ibanRequired');

  return {
    id,
    bankId: bank.id,
    bankName: bank.name,
    logo: bank.logo,
    iban,
    maskedNumber: maskIban(iban),
  };
}

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

/** Stateless mock transitions; the real API will replace these when available. */
export async function addBankAccountAction(
  payload: BankAccountPayload,
  current: BankAccount[]
): Promise<ActionResult<BankAccount[]>> {
  return run('bankAccounts.add', () => [...current, toAccount(`action-${Date.now()}`, payload)]);
}

export async function updateBankAccountAction(
  id: string,
  payload: BankAccountPayload,
  current: BankAccount[]
): Promise<ActionResult<BankAccount[]>> {
  return run('bankAccounts.update', () => {
    if (!current.some((account) => account.id === id)) {
      throw new AppError('not_found', 'bankAccounts.notFound');
    }
    return current.map((account) => (account.id === id ? toAccount(id, payload) : account));
  });
}

export async function deleteBankAccountAction(
  id: string,
  current: BankAccount[]
): Promise<ActionResult<BankAccount[]>> {
  return run('bankAccounts.delete', () => {
    if (!current.some((account) => account.id === id)) {
      throw new AppError('not_found', 'bankAccounts.notFound');
    }
    return current.filter((account) => account.id !== id);
  });
}
