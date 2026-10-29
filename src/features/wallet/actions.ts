"use server";

import { auth } from "@/auth";
import type { BankAccount } from "@/features/bank-accounts";
import { AppError } from "@/shared/lib/errors";
import { reportError } from "@/shared/lib/report";
import {
  fail,
  ok,
  toActionResult,
  type ActionResult,
} from "@/shared/lib/result";
import { toValidationError } from "@/shared/lib/validation";
import type { ZodType } from "zod";
import type { WalletData, WithdrawParams } from "./model";
import { topUpSchema, withdrawSchema } from "./validation";

function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}

async function run<T>(scope: string, write: () => T): Promise<ActionResult<T>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    return toActionResult(ok(write()));
  } catch (error) {
    reportError(error, { scope });
    return toActionResult(fail(error));
  }
}

/** Stateless mock transition; the real API will replace this when available. */
export async function topUpAction(
  amount: number,
  current: WalletData,
): Promise<ActionResult<WalletData>> {
  return run("wallet.topUp", () => {
    const values = parse(topUpSchema, { amount });

    return {
      summary: {
        ...current.summary,
        total: current.summary.total + values.amount,
        withdrawable: current.summary.withdrawable + values.amount,
      },
      transactions: [
        {
          id: `action-${Date.now()}`,
          type: "topup",
          status: "success",
          amount: values.amount,
          accountId: null,
          reference: "ACTION",
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
  accounts: BankAccount[],
): Promise<ActionResult<WalletData>> {
  return run("wallet.withdraw", () => {
    const values = parse(withdrawSchema(current.summary.withdrawable), params);
    if (!accounts.some((account) => account.id === values.bankAccountId)) {
      throw new AppError("not_found", "bankAccounts.notFound");
    }
    if (values.amount > current.summary.withdrawable) {
      throw new AppError("conflict", "wallet.insufficientBalance");
    }

    return {
      summary: {
        ...current.summary,
        total: current.summary.total - values.amount,
        withdrawable: current.summary.withdrawable - values.amount,
      },
      transactions: [
        {
          id: `action-${Date.now()}`,
          type: "withdrawal",
          status: "success",
          amount: values.amount,
          accountId: values.bankAccountId,
          reference: "ACTION",
          createdAt: new Date().toISOString(),
        },
        ...current.transactions,
      ],
    };
  });
}
