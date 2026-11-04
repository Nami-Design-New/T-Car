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
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      className="booking-type-dialog max-w-[650px] gap-0 rounded-[20px] px-7 py-6 sm:px-10 sm:py-7"
    >
      <Dialog.Header className="items-center">
        <Dialog.Title className="text-[clamp(1.4rem,3vw,1.85rem)] font-extrabold">
          {t("title")}
        </Dialog.Title>
        <Dialog.Close className="size-13 border-2 border-action-primary bg-transparent text-2xl text-text-primary hover:bg-primary-100" />
      </Dialog.Header>
      <Dialog.Body className="mt-6 overflow-visible">
        <RentalTabs
          availability={availability}
          onSelect={onSelect}
          variant="dialog"
        />
      </Dialog.Body>
    </Dialog>
  );
}
