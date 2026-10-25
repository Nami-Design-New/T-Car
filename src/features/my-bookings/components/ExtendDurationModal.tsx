"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useFieldErrorMessage } from "@/shared/hooks/useErrorMessage";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import {
  extendBookingSchema,
  type ExtendBookingFormValues,
} from "../validation";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (newDays: number) => void;
  currentDays?: number;
  pricePerDay?: number;
  loading?: boolean;
  /** Already translated; the dialog stays open and shows it after a failed submit. */
  error?: string;
}

export default function ExtendDurationModal({
  open,
  onClose,
  onConfirm,
  currentDays = 1,
  pricePerDay = 500,
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

  const increment = () => {
    setValue("days", days + 1, { shouldDirty: true, shouldValidate: true });
  };

  const decrement = () => {
    setValue("days", Math.max(1, days - 1), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const subtotal = days * pricePerDay;
  const vat = Math.round(subtotal * 0.05);
  const total = subtotal + vat;
  const submit = handleSubmit(({ days: nextDays }) => onConfirm(nextDays));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      placement="bottom-sheet"
      label={t("title")}
    >
      <form
        className="selection_modal flex w-full max-w-[420px] flex-col rounded-xl bg-surface-elevated p-5 max-[768px]:px-4 max-[768px]:pt-[42px] max-[768px]:pb-[18px]"
        onSubmit={submit}
        noValidate
      >
        {/* Close */}
        {/* Header */}
        <div className="flex items-center justify-between">
          <Dialog.Title className="py-2.5 text-[22px] text-text-primary max-[768px]:text-[17px]">
            {t("title")}
          </Dialog.Title>
          <Dialog.Close className="close_btn" />
        </div>

        {/* Duration */}
        <div className="mb-[18px] rounded-md bg-surface-card-primary px-3.5 pt-4 pb-3 text-center">
          <p className="mb-2 text-sm font-medium leading-normal text-text-primary">
            {t("selectDays")}
          </p>

          <div className="flex items-center justify-between gap-3 [direction:ltr]">
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded border-0 bg-surface-elevated text-[21px] text-text-primary"
              onClick={increment}
              aria-label={t("increase")}
            >
              +
            </button>

            <div className="flex h-12 flex-1 items-center justify-center text-[30px] font-bold leading-none text-text-primary">
              {days}
            </div>

            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded border-0 bg-surface-elevated text-[21px] text-text-primary"
              onClick={decrement}
              aria-label={t("decrease")}
            >
              −
            </button>
          </div>

          <p className="mt-2 mb-0 text-[11px] leading-normal text-text-primary">
            {t("note")}
          </p>
          {errors.days && (
            <p className="form_error" role="alert">
              {fieldError(errors.days.message)}
            </p>
          )}
        </div>

        {/* Price Details */}
        <div className="mb-[18px]">
          <h3 className="mb-2 text-end text-sm font-bold text-text-primary">
            {t("priceDetails")}
          </h3>

          {/* السعر */}
          <div className="grid min-h-[34px] grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-dashed border-stroke-light px-2.5 last:border-0">
            <span className="text-end text-sm text-text-subtle">
              {t("price")}
            </span>

            <span className="text-center text-sm text-text-subtle"></span>

            <strong className="whitespace-nowrap text-left text-sm font-medium text-text-primary">
              {pricePerDay} {t("currency")}
            </strong>
          </div>

          {/* المجموع الفرعي */}
          <div className="grid min-h-[34px] grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-dashed border-stroke-light px-2.5 last:border-0">
            <span className="text-end text-sm text-text-subtle">
              {t("subtotal")}
            </span>

            <span className="whitespace-nowrap text-center text-sm text-text-subtle">
              {days} × {pricePerDay}
            </span>

            <strong className="whitespace-nowrap text-left text-sm font-medium text-text-primary">
              {subtotal} {t("currency")}
            </strong>
          </div>

          {/* غرامة التأخير */}
          <div className="grid min-h-[34px] grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-dashed border-stroke-light px-2.5 text-status-error last:border-0">
            <span className="text-end text-sm">{t("lateFee")}</span>

            <span className="whitespace-nowrap text-center text-sm">
              {t("oneDay")}
            </span>

            <strong className="whitespace-nowrap text-left text-sm font-medium">
              0 {t("currency")}
            </strong>
          </div>

          {/* الضريبة */}
          <div className="grid min-h-[34px] grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-dashed border-stroke-light px-2.5 last:border-0">
            <span className="text-end text-sm text-text-subtle">
              {t("vat")}
            </span>

            <span className="whitespace-nowrap text-center text-sm text-text-subtle">
              5%
            </span>

            <strong className="whitespace-nowrap text-left text-sm font-medium text-text-primary">
              {vat} {t("currency")}
            </strong>
          </div>

          {/* الإجمالي */}
          <div className="mt-1 grid grid-cols-[1fr_auto_auto] items-center gap-3 border-0 border-t border-dashed border-stroke-light px-2.5 pt-2">
            <span className="text-end text-sm text-text-subtle">
              {t("total")}
            </span>

            <span className="text-center text-sm"></span>

            <strong className="whitespace-nowrap text-left text-lg font-bold text-action-primary">
              {total} {t("currency")}
            </strong>
          </div>
        </div>

        {error && (
          <p className="text-status-error text-sm mb-2" role="alert">
            {error}
          </p>
        )}

        {/* Confirm */}
        <Button
          type="submit"
          className="h-12 w-full cursor-pointer rounded-sm border-0 bg-action-primary text-sm font-semibold text-white transition hover:opacity-90"
          loading={loading}
        >
          {loading ? t("extending") : t("confirm")}
        </Button>
      </form>
    </Dialog>
  );
}
