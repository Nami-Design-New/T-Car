import { z } from "zod";
import { MAX_TOP_UP, MIN_TOP_UP, MIN_WITHDRAW } from "./model";

// Wallet schemas (doc 9). The amount bounds come from the active flow; balance
// and account ownership remain server-authoritative checks.
export const amountSchema = (min: number, max?: number) =>
  z
    .number({ error: "wallet.amountRequired" })
    .finite({ error: "wallet.invalidAmount" })
    .gte(min, { error: "wallet.amountTooLow" })
    .refine((amount) => max === undefined || amount <= max, {
      error: "wallet.amountTooHigh",
    });

export const amountFormSchema = (min: number, max?: number) =>
  z.object({ amount: amountSchema(min, max) });

export const topUpSchema = amountFormSchema(MIN_TOP_UP, MAX_TOP_UP);

export const withdrawSchema = (max: number) =>
  z.object({
    bankAccountId: z.string().min(1, { error: "wallet.bankAccountRequired" }),
    amount: amountSchema(MIN_WITHDRAW, max),
  });

export type WalletAmountValues = z.infer<typeof topUpSchema>;
