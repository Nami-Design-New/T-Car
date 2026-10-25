"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Dialog } from "@/shared/ui/Dialog";

import { ICONS } from "@/shared/config/assets";
const deliveryImg = ICONS.deliveryCar;
const branchImg = ICONS.branchCar;

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: () => void;
}

export default function PickupTypeModal({ open, onClose, onSelect }: Props) {
  const t = useTranslations("rentalSearch.pickup");

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body>
        <div className="grid grid-cols-2 gap-4 max-[575px]:grid-cols-1">
          <button
            className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-stroke-light bg-surface-background p-5 text-center transition hover:border-action-primary hover:bg-surface-card-primary hover:shadow-[0_10px_24px_rgba(31,127,250,0.12)] hover:[&>img]:scale-105 max-md:min-h-0 max-md:flex-row max-md:gap-2 max-md:px-3.5 max-md:py-[18px]"
            onClick={() => onSelect()}
          >
            <Image
              className="h-auto w-11 object-contain transition max-md:w-6"
              src={deliveryImg}
              alt={t("delivery.title")}
            />
            <h4 className="m-0 text-base font-semibold text-text-primary">
              {t("delivery.title")}
            </h4>
          </button>

          <button
            className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-stroke-light bg-surface-background p-5 text-center transition hover:border-action-primary hover:bg-surface-card-primary hover:shadow-[0_10px_24px_rgba(31,127,250,0.12)] hover:[&>img]:scale-105 max-md:min-h-0 max-md:flex-row max-md:gap-2 max-md:px-3.5 max-md:py-[18px]"
            onClick={() => onSelect()}
          >
            <Image
              className="h-auto w-11 object-contain transition max-md:w-6"
              src={branchImg}
              alt={t("branch.title")}
            />
            <h4 className="m-0 text-base font-semibold text-text-primary">
              {t("branch.title")}
            </h4>
          </button>
        </div>
      </Dialog.Body>
    </Dialog>
  );
}
