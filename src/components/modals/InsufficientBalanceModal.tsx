"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Dialog } from "@/shared/ui/Dialog";
import { PAYMENT_ICONS } from "@/shared/config/assets";
const walletIcon = PAYMENT_ICONS.wallet;

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

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
          src={walletIcon}
          alt=""
          width={150}
          height={150}
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

      <button
        type="button"
        className="h-[58px] w-full rounded-md border-0 bg-action-primary text-[17px] text-text-on-action hover:bg-action-primary/90"
        onClick={onConfirm}
      >
        {t("topUp")}
      </button>
    </Dialog>
  );
}
