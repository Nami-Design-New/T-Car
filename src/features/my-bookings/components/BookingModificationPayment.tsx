"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PaymentMethodModal } from "@/features/booking";
import { payModificationAction, type PaymentChoice } from "@/features/orders";
import { useErrorMessage } from "@/shared/hooks/useErrorMessage";
import { useNotify } from "@/shared/hooks/useNotify";
import { usePaymentWindow } from "@/shared/hooks/usePaymentWindow";
import type { AppError } from "@/shared/lib/errors";
import { fromActionResult } from "@/shared/lib/result";
import { Button } from "@/shared/ui/Button";
import { Price } from "@/shared/ui/Price";
import { ResultDialog } from "@/shared/ui/ResultDialog";

interface Props {
  bookingId: string;
  amount: number;
}

type Outcome = "success" | "failed" | null;

/** Pays the amount approved by the admin for a booking modification (E12). */
export default function BookingModificationPayment({
  bookingId,
  amount,
}: Props) {
  const t = useTranslations("myBookings.modificationPayment");
  const router = useRouter();
  const notify = useNotify();
  const errorMessage = useErrorMessage();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AppError>();
  const [outcome, setOutcome] = useState<Outcome>(null);

  const { watch, paying } = usePaymentWindow((paymentOutcome) => {
    if (paymentOutcome === "success") {
      setOpen(false);
      router.refresh();
      setOutcome("success");
    } else if (paymentOutcome === "failed") {
      setOpen(false);
      setOutcome("failed");
    }
  });

  const handlePay = async (choice: PaymentChoice) => {
    if (submitting || paying) return;

    setSubmitting(true);
    setError(undefined);
    const tab = choice.paymentMethodId ? window.open("", "_blank") : null;
    try {
      const result = fromActionResult(
        await payModificationAction({ orderId: bookingId, ...choice }),
      );
      if (!result.ok) {
        tab?.close();
        if (result.error.kind === "validation" && result.error.serverMessage) {
          notify.error(result.error.serverMessage);
        } else {
          setError(result.error);
        }
        return;
      }

      if (result.message) notify.success(result.message);
      if (result.data.kind === "paid") {
        tab?.close();
        setOpen(false);
        router.refresh();
        setOutcome("success");
        return;
      }

      if (!tab) {
        window.location.assign(result.data.payment.paymentUrl);
        return;
      }
      tab.location.href = result.data.payment.paymentUrl;
      watch(tab, result.data.payment);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="border-primary-500 bg-primary-50 flex flex-wrap items-center justify-between gap-4 rounded-md border-s-2 p-4">
        <div>
          <h2 className="text-text-primary m-0 text-sm font-bold">
            {t("title")}
          </h2>
          <p className="text-text-subtle mt-1 mb-0 text-sm">
            {t("description")}
          </p>
        </div>
        <Button type="button" size="md" onClick={() => setOpen(true)}>
          <span>{t("pay")}</span>
          <Price amount={amount} size="sm" />
        </Button>
      </section>

      <PaymentMethodModal
        open={open}
        onClose={() => {
          if (!submitting && !paying) setOpen(false);
        }}
        orderId={bookingId}
        amount={amount}
        onConfirm={handlePay}
        onTopUp={() => router.push("/account/wallet")}
        loading={submitting || paying}
        loadingLabel={paying ? t("waitingPayment") : undefined}
        error={error ? errorMessage(error) : undefined}
      />

      <ResultDialog
        open={outcome !== null}
        status={outcome === "success" ? "success" : "error"}
        description={outcome === "success" ? t("success") : t("failed")}
        onClose={() => setOutcome(null)}
      />
    </>
  );
}
