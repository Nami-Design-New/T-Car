"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PaymentMethodModal } from "@/features/booking";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { PriceRow } from "@/shared/ui/PriceRow";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useNotify } from "@/shared/hooks/useNotify";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { usePaymentWindow } from "@/shared/hooks/usePaymentWindow";
import type { PaymentChoice, PendingExtension } from "@/features/orders";
import { useBookingActions } from "../hooks/useBookingActions";

interface Props {
  bookingId: string;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

/** Pays a backend-created extension marked by `pay_extension`. */
export default function PendingExtensionPayment({ bookingId }: Props) {
  const t = useTranslations("myBookings.pendingExtension");
  const locale = useLocale();
  const router = useRouter();
  const notify = useNotify();
  const errorMessage = useErrorMessage();
  const [quote, setQuote] = useState<PendingExtension>();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>();
  const { submitting, getPendingExtension, payPendingExtension } =
    useBookingActions(bookingId);
  const { watch, paying } = usePaymentWindow((outcome) => {
    if (outcome === "success") router.refresh();
    else notify.error(t("failed"));
  });

  const notifyError = (error: Parameters<typeof errorMessage>[0]) =>
    notify.error(
      error instanceof Error && "serverMessage" in error
        ? ((error.serverMessage as string | undefined) ?? errorMessage(error))
        : errorMessage(error),
    );

  const open = async () => {
    setSummaryOpen(true);
    setQuote(undefined);
    setLoadingQuote(true);
    const result = await getPendingExtension();
    if (result.ok) {
      setQuote(result.data);
    } else {
      notifyError(result.error);
      setSummaryOpen(false);
    }
    setLoadingQuote(false);
  };

  const confirm = async (choice: PaymentChoice) => {
    if (submitting || paying) return;
    const tab = choice.paymentMethodId ? window.open("", "_blank") : null;
    const result = await payPendingExtension(choice);
    if (!result.ok) {
      tab?.close();
      notifyError(result.error);
      return;
    }
    if (result.message) notify.success(result.message);
    if (result.data.kind === "paid") {
      tab?.close();
      setPaymentOpen(false);
      router.refresh();
      setSuccessMessage(result.message ?? t("success"));
      return;
    }
    tab?.location.assign(result.data.payment.paymentUrl);
    if (tab) watch(tab, result.data.payment);
    else window.location.assign(result.data.payment.paymentUrl);
  };

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={() => void open()}
        loading={submitting}
      >
        {t("pay")}
      </Button>

      {summaryOpen && (
        <Dialog
          open
          onClose={() =>
            !loadingQuote && !submitting && !paying && setSummaryOpen(false)
          }
          label={t("dialogLabel")}
        >
          <Dialog.Header>
            <Dialog.Title>{t("title")}</Dialog.Title>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Body>
            {loadingQuote ? (
              <div className="flex flex-col gap-5" aria-busy="true">
                <div className="bg-primary-50 flex flex-col items-center gap-2 rounded-md py-3">
                  <Skeleton width="7rem" />
                  <Skeleton width="3rem" height="2.25rem" />
                  <Skeleton width="12rem" />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton width="8rem" />
                  <Skeleton shape="rect" height="2.75rem" />
                  <Skeleton shape="rect" height="2.75rem" />
                  <Skeleton shape="rect" height="2.75rem" />
                </div>
                <Skeleton shape="rect" height="3rem" />
              </div>
            ) : quote ? (
              <div className="flex flex-col gap-5">
                <div className="bg-primary-50 flex flex-col items-center rounded-md py-3">
                  <span className="text-text-subtle text-sm">
                    {t("daysCount")}
                  </span>
                  <strong className="text-text-primary text-3xl">
                    {quote.count}
                  </strong>
                  <span className="text-text-primary text-xs">
                    {t("endsOn", {
                      date: formatDate(quote.newDeliveryDay, locale),
                    })}
                  </span>
                </div>
                <div>
                  <h3 className="text-text-primary mb-2 text-base font-bold">
                    {t("priceDetails")}
                  </h3>
                  <PriceRow label={t("price")} amount={quote.carPrice} />
                  <PriceRow
                    label={t("subtotal")}
                    amount={quote.price}
                    hint={`${quote.count} × ${quote.carPrice}`}
                  />
                  <PriceRow label={t("serviceFee")} amount={quote.serviceFee} />
                  {quote.additionalServicesCost > 0 && (
                    <PriceRow
                      label={t("services")}
                      amount={quote.additionalServicesCost}
                    />
                  )}
                  {quote.offerDiscount > 0 && (
                    <PriceRow
                      label={t("discount")}
                      amount={-quote.offerDiscount}
                    />
                  )}
                  {quote.lateFee > 0 && (
                    <PriceRow
                      label={t("lateFee")}
                      amount={quote.lateFee}
                      labelClassName="text-status-error"
                    />
                  )}
                  <PriceRow
                    label={t("tax")}
                    amount={quote.taxAddedValue}
                    hint={
                      quote.taxType === "percent"
                        ? `${quote.taxValue}%`
                        : undefined
                    }
                  />
                  <PriceRow
                    label={t("total")}
                    amount={quote.totalAmount}
                    total
                  />
                </div>
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setSummaryOpen(false);
                    setPaymentOpen(true);
                  }}
                  loading={submitting || paying}
                >
                  {t("confirm")}
                </Button>
              </div>
            ) : null}
          </Dialog.Body>
        </Dialog>
      )}

      {quote && (
        <PaymentMethodModal
          open={paymentOpen}
          onClose={() => !submitting && !paying && setPaymentOpen(false)}
          orderId={bookingId}
          amount={quote.totalAmount}
          onConfirm={(choice) => void confirm(choice)}
          onTopUp={() => router.push("/account/wallet")}
          loading={submitting || paying}
        />
      )}

      <ResultDialog
        open={successMessage !== undefined}
        status="success"
        description={successMessage ?? ""}
        onClose={() => setSuccessMessage(undefined)}
      />
    </>
  );
}
