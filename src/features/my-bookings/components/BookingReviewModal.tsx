"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { StarRating } from "@/shared/ui/StarRating";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { Result } from "@/shared/lib/result";
import type { BookingReviewInput } from "../model";
import {
  bookingReviewSchema,
  type BookingReviewFormValues,
} from "../validation";

interface Props {
  submitting?: boolean;
  onSubmit: (input: BookingReviewInput) => Promise<Result<void>>;
  onClose: () => void;
}

export default function BookingReviewModal({
  submitting = false,
  onSubmit,
  onClose,
}: Props) {
  const t = useTranslations("myBookings.review");
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const {
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingReviewFormValues>({
    resolver: zodResolver(bookingReviewSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { showroomRating: 0, driverRating: 0 },
  });
  const showroomRating = watch("showroomRating");
  const driverRating = watch("driverRating");

  const submit = handleSubmit(async (values) => {
    if (submitting) return;

    const result = await onSubmit(values);
    if (result.ok) {
      onClose();
      return;
    }

    for (const [field, message] of Object.entries(
      result.error.fieldErrors ?? {},
    )) {
      if (field === "showroomRating" || field === "driverRating") {
        setError(field, { type: "server", message });
      }
    }
    if (
      !result.error.fieldErrors ||
      Object.keys(result.error.fieldErrors).length === 0
    ) {
      setError("root.server", {
        type: "server",
        message: errorMessage(result.error),
      });
    }
  });

  return (
    <Dialog open onClose={onClose} label={t("dialogLabel")}>
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>
        <form
          className="relative flex w-full flex-col items-stretch gap-4 bg-surface-elevated"
          onSubmit={submit}
          noValidate
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex w-full flex-col gap-4">
            <div>
              <StarRating
                label={t("showroomRating")}
                value={showroomRating}
                invalid={Boolean(errors.showroomRating)}
                errorId="showroom-rating-error"
                onChange={(value) => {
                  setValue("showroomRating", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  clearErrors("showroomRating");
                }}
                starLabel={(count) => t("stars", { count })}
              />
              {errors.showroomRating && (
                <p
                  id="showroom-rating-error"
                  className="form_error"
                  role="alert"
                >
                  {fieldError(errors.showroomRating.message)}
                </p>
              )}
            </div>
            <div>
              <StarRating
                label={t("driverRating")}
                value={driverRating}
                invalid={Boolean(errors.driverRating)}
                errorId="driver-rating-error"
                onChange={(value) => {
                  setValue("driverRating", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  clearErrors("driverRating");
                }}
                starLabel={(count) => t("stars", { count })}
              />
              {errors.driverRating && (
                <p id="driver-rating-error" className="form_error" role="alert">
                  {fieldError(errors.driverRating.message)}
                </p>
              )}
            </div>
          </div>

          {errors.root?.server?.message && (
            <p className="text-status-error text-sm mb-2" role="alert">
              {errors.root.server.message}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={submitting}
            disabled={!showroomRating || !driverRating}
          >
            {submitting ? t("sending") : t("submit")}
          </Button>
        </form>
      </Dialog.Body>
    </Dialog>
  );
}
