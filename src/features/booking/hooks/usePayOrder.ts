"use client";

import { useCallback, useState } from "react";
import { fail, fromActionResult, type Result } from "@/shared/lib/result";
import { reportError } from "@/shared/lib/report";
import {
  payOrderAction,
  type PaymentChoice,
  type PayOrderResult,
} from "@/features/orders";

/** Pays a checkout draft (E5) through the authenticated Server Action. */
export function usePayOrder() {
  const [submitting, setSubmitting] = useState(false);

  const payOrder = useCallback(
    async (
      orderId: string,
      choice: PaymentChoice,
    ): Promise<Result<PayOrderResult>> => {
      setSubmitting(true);
      try {
        return fromActionResult(await payOrderAction({ orderId, ...choice }));
      } catch (error) {
        reportError(error, { scope: "booking.pay", orderId });
        return fail(error);
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  return { submitting, payOrder };
}
