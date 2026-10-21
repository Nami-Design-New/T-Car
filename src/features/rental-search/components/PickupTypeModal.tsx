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
    <Dialog open={open} onClose={onClose} size="md" className="pickup_modal">
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close className="close_btn" />
      </Dialog.Header>

      <Dialog.Body>
        <div className="pickup_cards">
          <button className="pickup_card" onClick={() => onSelect()}>
            <Image src={deliveryImg} alt={t("delivery.title")} />
            <h4>{t("delivery.title")}</h4>
          </button>

          <button className="pickup_card" onClick={() => onSelect()}>
            <Image src={branchImg} alt={t("branch.title")} />
            <h4>{t("branch.title")}</h4>
          </button>
        </div>
      </Dialog.Body>
    </Dialog>
  );
}
