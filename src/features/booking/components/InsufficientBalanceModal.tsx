"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Dialog } from "@/shared/ui/Dialog";
import { Button } from "@/shared/ui/Button";
import { PAYMENT_ICONS } from "@/shared/config/assets";

const lowBalanceIcon = PAYMENT_ICONS.lowBalance;

interface Props {
  open: boolean;
  onClose: () => void;
  /** "Top up now": the caller takes the customer to the wallet. */
  onConfirm: () => void;
}

/** Shown when the wallet balance does not cover the booking total (O6, R14). */
export default function InsufficientBalanceModal({
  open,
  onClose,
  onConfirm,
}: Props) {
  const t = useTranslations("wallet.insufficient");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="w-[min(430px,calc(100%-32px))] overflow-hidden rounded-2xl bg-surface-elevated px-[18px] pt-5 pb-[26px] max-[575px]:px-4"
      placement="bottom-sheet"
      label={t("title")}
    >
      <span
        className="mx-auto mb-[18px] block h-2 w-[86px] rounded-full bg-surface-disabled"
        aria-hidden="true"
      />

      <Dialog.Header className="flex items-center justify-between">
        <Dialog.Title className="text-2xl font-bold text-text-primary max-[575px]:text-[21px]">
          {t("title")}
        </Dialog.Title>
        <Dialog.Close className="size-12 rounded-md border border-stroke-light text-[27px]" />
      </Dialog.Header>

      <div className="mt-1 flex h-[205px] items-center justify-center max-[575px]:h-[180px]">
        <Image
          className="max-[575px]:size-[132px]"
          src={lowBalanceIcon.src}
          alt=""
          width={lowBalanceIcon.width}
          height={lowBalanceIcon.height}
        />
      </div>

      <div className="text-center">
        <h2 className="mb-2 text-[25px] font-bold text-text-primary max-[575px]:text-[22px]">
          {t("heading")}
        </h2>
        <p className="mx-auto mb-[18px] text-[15px] leading-[1.7] text-text-primary">
          {t("description")}
        </p>
      </div>

      <Button type="button" size="lg" className="w-full" onClick={onConfirm}>
        {t("topUp")}
      </Button>
    </Dialog>
  );
}
