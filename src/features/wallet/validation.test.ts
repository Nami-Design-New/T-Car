import { describe, expect, it } from "vitest";
import { toValidationError } from "@/shared/lib/validation";
import { MAX_TOP_UP, MIN_TOP_UP, MIN_WITHDRAW } from "./model";
import { topUpSchema, withdrawSchema } from "./validation";

function fieldErrors(result: ReturnType<typeof topUpSchema.safeParse>) {
  if (result.success) return undefined;
  return toValidationError(result.error).fieldErrors;
}

describe("wallet amount schemas", () => {
  it("accepts top-ups at both configured bounds", () => {
    expect(topUpSchema.parse({ amount: MIN_TOP_UP })).toEqual({
      amount: MIN_TOP_UP,
    });
    expect(topUpSchema.parse({ amount: MAX_TOP_UP })).toEqual({
      amount: MAX_TOP_UP,
    });
  });

  it("rejects a missing, non-finite, too-small, and too-large top-up", () => {
    expect(fieldErrors(topUpSchema.safeParse({}))).toEqual({
      amount: "wallet.amountRequired",
    });
    expect(fieldErrors(topUpSchema.safeParse({ amount: Number.NaN }))).toEqual({
      amount: "wallet.amountRequired",
    });
    expect(
      fieldErrors(topUpSchema.safeParse({ amount: MIN_TOP_UP - 1 })),
    ).toEqual({
      amount: "wallet.amountTooLow",
    });
    expect(
      fieldErrors(topUpSchema.safeParse({ amount: MAX_TOP_UP + 1 })),
    ).toEqual({
      amount: "wallet.amountTooHigh",
    });
  });

  it("uses the current withdrawable balance as the withdrawal maximum", () => {
    const schema = withdrawSchema(50);
    expect(
      schema.parse({ bankAccountId: "bank-1", amount: MIN_WITHDRAW }),
    ).toEqual({
      bankAccountId: "bank-1",
      amount: MIN_WITHDRAW,
    });
    expect(
      toValidationError(
        schema.safeParse({ bankAccountId: "", amount: 51 }).error!,
      ).fieldErrors,
    ).toEqual({
      bankAccountId: "wallet.bankAccountRequired",
      amount: "wallet.amountTooHigh",
    });
  });
});
