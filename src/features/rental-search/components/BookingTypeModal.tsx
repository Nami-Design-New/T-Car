"use client";

import { useTranslations } from "next-intl";
import { Dialog } from "@/shared/ui/Dialog";
import type { RentalType } from "../model";
import RentalTabs from "./RentalTabs";

interface Props {
  open: boolean;
  availability: Record<RentalType, boolean>;
  onClose: () => void;
  onSelect: (type: RentalType) => void;
}

/** Selects one of the booking methods supported by the selected city car. */
export default function BookingTypeModal({
  open,
  availability,
  onClose,
  onSelect,
}: Props) {
  const t = useTranslations("rentalSearch.booking");

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>
        <RentalTabs availability={availability} onSelect={onSelect} />
      </Dialog.Body>
    </Dialog>
  );
}
