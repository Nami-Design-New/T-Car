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
import { useNotify } from "@/shared/hooks/useNotify";
import type { Result } from "@/shared/lib/result";
import type {
  BookingReviewInput,
  BookingReviewResult,
} from "@/features/orders";
import {
  bookingReviewSchema,
  type BookingReviewFormValues,
} from "../validation";

interface Props {
  submitting?: boolean;
  hasDriver: boolean;
  initialRating: { companyRate: number | null; driverRate: number | null };
  onSubmit: (input: BookingReviewInput) => Promise<Result<BookingReviewResult>>;
  onClose: () => void;
}

export default function BookingReviewModal({
  submitting = false,
  hasDriver,
  initialRating,
  onSubmit,
  onClose,
}: Props) {
  const t = useTranslations("myBookings.review");
  const errorMessage = useErrorMessage();
  const fieldError = useFieldErrorMessage();
  const notify = useNotify();
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
    defaultValues: {
      showroomRating: initialRating.companyRate ?? 0,
      driverRating: hasDriver ? (initialRating.driverRate ?? 0) : undefined,
    },
  });
  const showroomRating = watch("showroomRating");
  const driverRating = watch("driverRating") ?? 0;

  const submit = handleSubmit(async (values) => {
    if (submitting) return;

    const result = await onSubmit({
      showroomRating: values.showroomRating,
      ...(hasDriver ? { driverRating: values.driverRating! } : {}),
    });
    if (result.ok) {
      onClose();
      return;
    }

    notify.error(result.error.serverMessage ?? errorMessage(result.error));

    for (const [field, message] of Object.entries(
      result.error.fieldErrors ?? {},
    )) {
      if (field === "showroomRating" || field === "driverRating") {
        setError(field, { type: "server", message });
      }
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
          className="bg-surface-elevated relative flex w-full flex-col items-stretch gap-4"
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
            {hasDriver && (
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
                  <p
                    id="driver-rating-error"
                    className="form_error"
                    role="alert"
                  >
                    {fieldError(errors.driverRating.message)}
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={submitting}
            disabled={!showroomRating || (hasDriver && !driverRating)}
          >
            {submitting ? t("sending") : t("submit")}
          </Button>
        </form>
      </Dialog.Body>
    </Dialog>
  );
}
