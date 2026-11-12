"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormatter, useTranslations } from "next-intl";
import type { ExtensionQuote } from "@/features/orders";
import {
  useErrorMessage,
  useFieldErrorMessage,
} from "@/shared/hooks/useErrorMessage";
import type { Result } from "@/shared/lib/result";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { NumberStepper } from "@/shared/ui/NumberStepper";
import { PriceRow } from "@/shared/ui/PriceRow";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  extendBookingSchema,
  type ExtendBookingFormValues,
} from "../validation";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (days: number, quote: ExtensionQuote) => void;
  onGetQuote: (days: number) => Promise<Result<ExtensionQuote>>;
  currentDays: number;
  pricePerDay: number;
  price: number;
  returnAt: string;
  status: "current" | "late";
  lateHours: number | null;
  taxRate: number;
  taxRateType: string;
  taxValue: number;
  finalPrice: number;
  loading?: boolean;
  error?: string;
}

export default function ExtendDurationModal({
  open,
  onClose,
  onConfirm,
  onGetQuote,
  currentDays,
  pricePerDay,
  price,
  returnAt,
  status,
  lateHours,
  taxRate,
  taxRateType,
  taxValue,
  finalPrice,
  loading = false,
  error,
}: Props) {
  const t = useTranslations("myBookings.extend");
  const format = useFormatter();
  const fieldError = useFieldErrorMessage();
  const errorMessage = useErrorMessage();
  const [quote, setQuote] = useState<ExtensionQuote>();
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string>();
  const [hasRequestedQuote, setHasRequestedQuote] = useState(false);
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
    defaultValues: { days: 1 },
  });
  const days = watch("days");
  const currentLateDays =
    status === "late" ? Math.max(1, Math.ceil((lateHours ?? 0) / 24)) : 0;
  const currentLateFee = currentLateDays * pricePerDay;
  const displayed = quote ?? {
    count: currentDays,
    carPrice: pricePerDay,
    price,
    newDeliveryDay: returnAt.slice(0, 10),
    lateFee: currentLateFee,
    lateDays: currentLateDays,
    taxType: taxRateType,
    taxValue: taxRate,
    taxAddedValue: taxValue,
    totalAmount: finalPrice,
  };
  const extensionEnd = new Date(`${displayed.newDeliveryDay}T12:00:00`);
  const extensionEndLabel = format.dateTime(extensionEnd, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  useEffect(() => {
    if (open) {
      reset({ days: 1 });
      setHasRequestedQuote(false);
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open || !hasRequestedQuote) {
      setQuote(undefined);
      setQuoteError(undefined);
      setQuoteLoading(false);
      return;
    }
    let active = true;
    setQuoteLoading(true);
    setQuote(undefined);
    setQuoteError(undefined);
    void onGetQuote(days).then((result) => {
      if (!active) return;
      setQuoteLoading(false);
      if (result.ok) setQuote(result.data);
      else
        setQuoteError(result.error.serverMessage ?? errorMessage(result.error));
    });
    return () => {
      active = false;
    };
  }, [days, errorMessage, hasRequestedQuote, onGetQuote, open]);

  const changeDays = (value: number) => {
    setHasRequestedQuote(true);
    setValue("days", value, { shouldDirty: true, shouldValidate: true });
  };
  const submit = handleSubmit(({ days: nextDays }) => {
    if (quote) onConfirm(nextDays, quote);
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      placement="bottom-sheet"
      label={t("title")}
    >
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>
        <form
          className="flex w-full flex-col gap-2"
          onSubmit={submit}
          noValidate
        >
          <div className="bg-surface-card-primary mb-4.5 rounded-md px-3.5 pt-4 pb-3 text-center">
            <p className="text-text-primary mb-2 text-sm leading-normal font-medium">
              {t("selectDays")}
            </p>
            <NumberStepper
              value={days}
              onChange={changeDays}
              disabled={loading || quoteLoading}
              decreaseLabel={t("decrease")}
              increaseLabel={t("increase")}
            />
            <p className="text-text-primary mt-2 mb-0 text-xs leading-normal">
              {t("quotePending", { date: extensionEndLabel })}
            </p>
            {errors.days && (
              <p className="form_error" role="alert">
                {fieldError(errors.days.message)}
              </p>
            )}
          </div>
          <section className="border-stroke-light mb-4.5 rounded-lg border p-4">
            <h3 className="text-text-primary mb-2 text-end text-sm font-bold">
              {t("priceDetails")}
            </h3>
            {quoteLoading ? (
              <Skeleton shape="rect" height={180} />
            ) : (
              <>
                {quoteError && (
                  <p className="text-status-error m-0 text-sm" role="alert">
                    {quoteError}
                  </p>
                )}
                <PriceRow label={t("price")} amount={displayed.carPrice} />
                <PriceRow
                  label={t("subtotal")}
                  amount={displayed.price}
                  hint={`${displayed.count} × ${displayed.carPrice}`}
                />
                {status === "late" && (
                  <PriceRow
                    label={t("lateFee")}
                    amount={displayed.lateFee}
                    hint={t("lateDays", { count: displayed.lateDays })}
                    labelClassName="text-status-error"
                    hintClassName="text-status-error"
                  />
                )}
                <PriceRow
                  label={t("vat")}
                  amount={displayed.taxAddedValue}
                  hint={
                    displayed.taxType === "percent"
                      ? `${displayed.taxValue}%`
                      : undefined
                  }
                />
                <PriceRow
                  label={t("total")}
                  amount={displayed.totalAmount}
                  total
                />
              </>
            )}
          </section>
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button
          type="button"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={
            loading || quoteLoading || !quote || !!quoteError
          }
          onClick={() => void submit()}
        >
          {t("confirm")}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
