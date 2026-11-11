"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useFieldErrorMessage } from "@/shared/hooks/useErrorMessage";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { NumberStepper } from "@/shared/ui/NumberStepper";
import {
  extendBookingSchema,
  type ExtendBookingFormValues,
} from "../validation";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (newDays: number) => void;
  currentDays?: number;
  pricePerDay: number;
  loading?: boolean;
  /** Already translated; the dialog stays open and shows it after a failed submit. */
  error?: string;
}

export default function ExtendDurationModal({
  open,
  onClose,
  onConfirm,
  currentDays = 1,
  pricePerDay,
  loading = false,
  error,
}: Props) {
  const t = useTranslations("myBookings.extend");
  const fieldError = useFieldErrorMessage();
  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExtendBookingFormValues>({
    resolver: zodResolver(extendBookingSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { days: currentDays },
  });
  const days = watch("days");

  useEffect(() => {
    if (open) reset({ days: currentDays });
  }, [currentDays, open, reset]);

  const changeDays = (value: number) => {
    setValue("days", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const submit = handleSubmit(({ days: nextDays }) => onConfirm(nextDays));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      placement="bottom-sheet"
      label={t("title")}
    >
      <form
        className="bg-surface-elevated flex w-full max-w-[420px] flex-col rounded-xl p-5 max-[768px]:px-4 max-[768px]:pt-[42px] max-[768px]:pb-[18px]"
        onSubmit={submit}
        noValidate
      >
        {/* Close */}
        {/* Header */}
        <div className="flex items-center justify-between">
          <Dialog.Title className="text-text-primary py-2.5 text-[22px] max-[768px]:text-[17px]">
            {t("title")}
          </Dialog.Title>
          <Dialog.Close />
        </div>

        {/* Duration */}
        <div className="bg-surface-card-primary mb-[18px] rounded-md px-3.5 pt-4 pb-3 text-center">
          <p className="text-text-primary mb-2 text-sm leading-normal font-medium">
            {t("selectDays")}
          </p>

          <NumberStepper
            value={days}
            onChange={changeDays}
            disabled={loading}
            decreaseLabel={t("decrease")}
            increaseLabel={t("increase")}
          />

          <p className="text-text-primary mt-2 mb-0 text-[11px] leading-normal">
            {t("quotePending")}
          </p>
          {errors.days && (
            <p className="form_error" role="alert">
              {fieldError(errors.days.message)}
            </p>
          )}
        </div>

        {/* Price Details */}
        <div className="mb-[18px]">
          <h3 className="text-text-primary mb-2 text-end text-sm font-bold">
            {t("priceDetails")}
          </h3>

          {/* السعر */}
          <div className="border-stroke-light grid min-h-8.5 grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-dashed px-2.5 last:border-0">
            <span className="text-text-subtle text-end text-sm">
              {t("price")}
            </span>

            <span className="text-text-subtle text-center text-sm"></span>

            <strong className="text-text-primary text-left text-sm font-medium whitespace-nowrap">
              {pricePerDay} {t("currency")}
            </strong>
          </div>

          {/* TODO(O8): replace this with the E9 extension quote rows. */}
        </div>

        {error && (
          <p className="text-status-error mb-2 text-sm" role="alert">
            {error}
          </p>
        )}

        {/* Confirm */}
        <Button
          type="submit"
          className="bg-action-primary h-12 w-full cursor-pointer rounded-sm border-0 text-sm font-semibold text-white transition hover:opacity-90"
          loading={loading}
        >
          {loading ? t("extending") : t("confirm")}
        </Button>
      </form>
    </Dialog>
  );
}
