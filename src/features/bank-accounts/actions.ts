'use server';

import { auth } from '@/auth';
import { bankAccountsApi } from '@/services/bankAccounts.api';
import { AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import type { BankAccountPayload } from './model';

/**
 * Server Action boundary for bank-account writes. The current mock remains a
 * browser-only stateful adapter until a user-scoped persistence contract is
 * available, so these actions are the first safe seam for the migration.
 */
async function run(scope: string, write: () => Promise<void>): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError('unauthorized');
    await write();
    return toActionResult(ok(undefined));
  } catch (error) {
    reportError(error, { scope });
    return toActionResult(fail(error));
  }
}

export function addBankAccountAction(payload: BankAccountPayload): Promise<ActionResult<void>> {
  return run('bankAccounts.add', () => bankAccountsApi.addBankAccount(payload));
}

export function updateBankAccountAction(
  id: string,
  payload: BankAccountPayload
): Promise<ActionResult<void>> {
  return run('bankAccounts.update', () => bankAccountsApi.updateBankAccount(id, payload));
}

export function deleteBankAccountAction(id: string): Promise<ActionResult<void>> {
  return run('bankAccounts.delete', () => bankAccountsApi.deleteBankAccount(id));
}
