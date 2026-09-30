'use server';

import { auth } from '@/auth';
import { walletApi } from '@/services/wallet.api';
import { AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import type { WithdrawParams } from './model';

/**
 * Server Action boundary for wallet writes. The account id is checked here so
 * the action remains safe when called directly by a client component.
 *
 * The current wallet mock is intentionally still browser-only and stateful;
 * wiring these actions into the UI waits for a user-scoped API/mock adapter.
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

export function topUpAction(amount: number): Promise<ActionResult<void>> {
  return run('wallet.topUp', () => walletApi.topUp(amount));
}

export function withdrawAction(params: WithdrawParams): Promise<ActionResult<void>> {
  return run('wallet.withdraw', () => walletApi.withdraw(params));
}
