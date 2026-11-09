"use client";

import { useCallback, useState } from "react";
import { fail, fromActionResult, type Result } from "@/shared/lib/result";
import { AppError } from "@/shared/lib/errors";
import { reportError } from "@/shared/lib/report";
import {
  createDraftAction,
  type BookingContext,
  type BookingDetails,
  type CreateDraftRequest,
  type Order,
  type BookingServiceSelection,
} from "@/features/orders";

export function useCreateDraft(carId: string) {
  const [submitting, setSubmitting] = useState(false);

  const createDraft = useCallback(
    async (
      context: BookingContext,
      details: BookingDetails,
      services?: BookingServiceSelection[],
    ): Promise<Result<Order>> => {
      setSubmitting(true);
      try {
        if (!context.branch) {
          return fail(new AppError("validation", "booking.invalidLocation"));
        }

        const request: CreateDraftRequest = {
          carId,
          branchId: context.branch.id,
          bookingType: context.bookingType,
          deliveryType: context.deliveryType,
          details,
          services,
          countryId: context.countryId,
        };
        return fromActionResult(await createDraftAction(request));
      } catch (error) {
        reportError(error, { scope: "booking.draft" });
        return fail(error);
      } finally {
        setSubmitting(false);
      }
    },
    [carId],
  );

  return { submitting, createDraft };
}
