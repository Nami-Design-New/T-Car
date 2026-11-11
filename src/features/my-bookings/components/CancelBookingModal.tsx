"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Dialog } from "@/shared/ui/Dialog";
import { Price } from "@/shared/ui/Price";

import { IMAGES } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
const cancelBookingImage = IMAGES.cancelBooking;

export interface CancelQuote {
  paidAmount: number;
  discountPercent: number;
  cancellationFee: number;
  total: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;

  bookingAmount: number;
  /** E8 quote data loaded before the confirmation can be submitted. */
  quote?: CancelQuote;
  loading?: boolean;
  /** Already translated; the dialog stays open and shows it after a failed submit. */
  error?: string;
}

export default function CancelBookingModal({
  open,
  onClose,
  onConfirm,
  bookingAmount,
  quote,
  loading = false,
  error,
}: Props) {
  const t = useTranslations("myBookings.cancel");
  // Keep the layout usable while the quote request is still in flight.
  const paidAmount = quote?.paidAmount ?? bookingAmount;
  const discountPercent = quote?.discountPercent ?? 0;
  const cancellationFee = quote?.cancellationFee ?? 0;
  const refundedAmount =
    quote?.total ?? Math.max(paidAmount - cancellationFee, 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      placement="center"
      size="lg"
      label={t("dialogLabel")}
    >
      {/* Close */}
      <Dialog.Header>
        <Dialog.Title className="text-text-primary py-2.5 text-[22px]">
          {t("title")}
        </Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>
        <div className="mb-3 flex h-30 w-full items-center justify-center">
          <Image
            src={cancelBookingImage}
            alt={t("title")}
            width={140}
            height={110}
          />
        </div>

        <div className="mb-3.5 text-center">
          <h3 className="text-text-primary m-0 text-[15px] leading-relaxed font-bold">
            {t("question")}
          </h3>
        </div>

        <div className="bg-status-error-background mb-4.5 rounded-sm px-4 py-3 text-center">
          <p className="text-text-primary m-0 text-[12px] leading-relaxed">
            {t("feePolicy", { percent: discountPercent })}
          </p>
        </div>

        <div className="mb-4 w-full">
          <h3 className="text-text-primary mb-1.5 text-base font-bold">
            {t("amountDetails")}
          </h3>

          <div className="border-stroke-light divide-stroke-light w-full divide-y divide-dashed">
            <AmountRow label={t("paid")} amount={paidAmount} />
            <div className="border-stroke-light flex min-h-9 items-center justify-between gap-2 border-x-0 border-b border-dashed px-1">
              <span className="text-text-subtle min-w-0 text-[13px]">
                {t("discountPercent")}
              </span>
              <strong className="text-status-error min-w-0 text-[13px] font-medium whitespace-nowrap">
                {discountPercent}%
              </strong>
            </div>
            <AmountRow
              label={t("cancellationFee")}
              amount={-cancellationFee}
              amountClassName="text-status-error"
            />
            <AmountRow
              label={t("total")}
              total={true}
              amount={refundedAmount}
              amountClassName="text-text-primary font-bold"
            />
          </div>

          <div className="bg-action-primary/10 mt-4 rounded-xl px-4 py-3 text-center">
            <p className="text-text-primary m-0 text-[13px] font-semibold">
              {t("refundedToYou")}
            </p>
            <Price
              amount={refundedAmount}
              size="xl"
              amountClassName="text-text-primary text-3xl font-bold"
              className="mt-1 justify-center gap-2"
            />
          </div>
        </div>

        {error && (
          <p className="text-status-error mb-2 text-sm" role="alert">
            {error}
          </p>
        )}
      </Dialog.Body>
      <Dialog.Footer>
        <div className="flex w-full items-stretch gap-2">
          <Button
            type="button"
            size="lg"
            className="grow"
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
          >
            {t("confirm")}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="border-stroke-heavy bg-surface-elevated text-text-subtle order-2 w-20 shrink-0"
            onClick={onClose}
          >
            {t("back")}
          </Button>
        </div>
      </Dialog.Footer>
    </Dialog>
  );
}

function AmountRow({
  label,
  amount,
  amountClassName,
  total,
}: {
  label: string;
  amount: number;
  amountClassName?: string;
  total?: boolean;
}) {
  return (
    <div className="border-stroke-light flex min-h-9 items-center justify-between gap-2 border-x-0 border-t-0 border-b border-dashed px-1">
      <span
        className={cn(
          "text-text-subtle min-w-0",
          total ? "text-xl font-bold" : "text-sm",
        )}
      >
        {label}
      </span>
      <Price
        amount={amount}
        size="sm"
        amountClassName={`text-[13px] font-medium ${amountClassName ?? "text-text-primary"}`}
      />
    </div>
  );
}
