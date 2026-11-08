"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Dialog } from "@/shared/ui/Dialog";

import { IMAGES } from "@/shared/config/assets";
const cancelBookingImage = IMAGES.cancelBooking;

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;

  bookingAmount: number;
  loading?: boolean;
  /** Already translated; the dialog stays open and shows it after a failed submit. */
  error?: string;
}

export default function CancelBookingModal({
  open,
  onClose,
  onConfirm,
  bookingAmount,
  loading = false,
  error,
}: Props) {
  const t = useTranslations("myBookings.cancel");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      placement="bottom-sheet"
      label={t("dialogLabel")}
    >
      <div className="relative box-border max-h-[92vh] w-[600px] max-w-full rounded-xl bg-surface-elevated px-6 pt-10 pb-6 shadow-[0_20px_50px_rgba(30,30,30,0.15)] max-[620px]:pt-8">
        {/* Close */}
        <div className="mb-1 flex items-center justify-between">
          <Dialog.Title className="py-2.5 text-[22px] text-text-primary">
            {t("title")}
          </Dialog.Title>
          <Dialog.Close />
        </div>

        <div className="mb-3 flex h-[120px] w-full items-center justify-center">
          <Image
            src={cancelBookingImage}
            alt={t("title")}
            width={140}
            height={110}
          />
        </div>

        <div className="mb-3.5 text-center">
          <h3 className="m-0 text-[15px] font-bold leading-relaxed text-text-primary">
            {t("question")}
          </h3>
        </div>

        <div className="mb-[18px] w-full rounded-sm bg-status-error-background px-4 py-3 text-center">
          <p className="m-0 text-[11.5px] leading-relaxed text-text-subtle">
            {t("quotePending")}
          </p>
        </div>

        <div className="mb-4 w-full">
          <h3 className="mb-1.5 text-end text-[15px] font-bold text-text-primary">
            {t("amountDetails")}
          </h3>

          <div className="flex min-h-9 w-full flex-nowrap items-center justify-between gap-2 border-b border-dashed border-stroke-light px-1">
            <span className="min-w-0 text-[13px] text-text-subtle">
              {t("paid")}
            </span>
            <strong className="min-w-0 whitespace-nowrap text-[13px] font-medium text-text-primary">
              {bookingAmount} {t("currency")}
            </strong>
          </div>

        </div>

        {/* TODO(O7): show cancellation fee and refund only after E8 returns its quote. */}

        {error && (
          <p className="text-status-error text-sm mb-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex w-full items-stretch gap-2">
          <button
            type="button"
            className="order-1 h-[46px] min-w-0 flex-1 cursor-pointer rounded-sm border-0 bg-action-primary text-[13px] font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t("cancelling") : t("confirm")}
          </button>

          <button
            type="button"
            className="order-2 h-[46px] w-20 shrink-0 cursor-pointer rounded-sm border border-stroke-heavy bg-surface-elevated text-[13px] font-semibold text-text-subtle transition hover:opacity-90 active:scale-[0.98]"
            onClick={onClose}
          >
            {t("back")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
