'use server';

import { auth } from '@/auth';
import { MOCK_BANKS } from '@/services/mocks/bankAccounts';
import { AppError } from '@/shared/lib/errors';
import { reportError } from '@/shared/lib/report';
import { fail, ok, toActionResult, type ActionResult } from '@/shared/lib/result';
import { toValidationError } from '@/shared/lib/validation';
import type { ZodType } from 'zod';
import { maskIban, type BankAccount, type BankAccountPayload } from './model';
import { bankAccountSchema } from './validation';

function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}

function toAccount(id: string, payload: BankAccountPayload): BankAccount {
  const bank = MOCK_BANKS.find((item) => item.id === payload.bankId);
  if (!bank) {
    throw new AppError('validation', 'bankAccounts.unknownBank', undefined, {
      bankId: 'bankAccounts.unknownBank',
    });
  }

  return {
    id,
    bankId: bank.id,
    bankName: bank.name,
    logo: bank.logo,
    iban: payload.iban,
    maskedNumber: maskIban(payload.iban),
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
  return run('bankAccounts.add', () => {
    const values = parse(bankAccountSchema, payload);
    return [...current, toAccount(`action-${Date.now()}`, values)];
  });
}

export async function updateBankAccountAction(
  id: string,
  payload: BankAccountPayload,
  current: BankAccount[]
): Promise<ActionResult<BankAccount[]>> {
  return run('bankAccounts.update', () => {
    const values = parse(bankAccountSchema, payload);
    if (!current.some((account) => account.id === id)) {
      throw new AppError('not_found', 'bankAccounts.notFound');
    }
    return current.map((account) => (account.id === id ? toAccount(id, values) : account));
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
