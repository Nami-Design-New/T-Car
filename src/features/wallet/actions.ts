"use server";

import { auth } from "@/auth";
import { AppError } from "@/shared/lib/errors";
import { reportError } from "@/shared/lib/report";
import { fail, toActionResult, type ActionResult } from "@/shared/lib/result";
import { toValidationError } from "@/shared/lib/validation";
import { walletApi } from "./api";
import type { ZodType } from "zod";
import type {
  WalletTopUpPayment,
  WalletTransaction,
  WithdrawParams,
} from "./model";
import { topUpSchema, withdrawSchema } from "./validation";

function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}

/**
 * Creates a top-up payment for the parsed amount. The balance is not changed
 * here: the customer pays at the returned URL and the API applies it.
 */
export async function topUpAction(
  amount: number,
): Promise<ActionResult<WalletTopUpPayment>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const values = parse(topUpSchema, { amount });
    const result = await walletApi.topUp(values.amount);
    if (!result.ok) throw result.error;
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "wallet.topUp" });
    return toActionResult(fail(error));
  }
}

/**
 * Requests a withdrawal to one of the customer's bank accounts. The amount
 * and account are parsed again here; the balance, the account's ownership, and
 * any limit stay with the API, which rejects them with a 422 message.
 */
export async function withdrawAction(
  params: WithdrawParams,
): Promise<ActionResult<WalletTransaction>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const values = parse(withdrawSchema(), params);
    const result = await walletApi.withdraw(values);
    if (!result.ok) throw result.error;
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "wallet.withdraw" });
    return toActionResult(fail(error));
  }
}
