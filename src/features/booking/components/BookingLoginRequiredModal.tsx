"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { IMAGES } from "@/shared/config/assets";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export default function BookingLoginRequiredModal({
  open,
  onClose,
  onLogin,
}: Props) {
  const t = useTranslations("booking.loginRequired");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      label={t("dialogLabel")}
     
    >
      <Dialog.Body className="flex flex-col items-center  text-center ">
      
        <Dialog.Title className="sr-only">{t("title")}</Dialog.Title>
        <Image
          src={IMAGES.bookingLoginRequired.src}
          alt=""
          width={IMAGES.bookingLoginRequired.width}
          height={IMAGES.bookingLoginRequired.height}
          className="mb-5 h-auto w-full max-w-70"
        />
        <Dialog.Description className="mx-0 mt-0 mb-6 text-xl leading-9 font-semibold text-text-primary ">
          {t("description")}
        </Dialog.Description>
        <Button type="button" size="lg" className="w-full" onClick={onLogin}>
          {t("login")}
        </Button>
      </Dialog.Body>
    </Dialog>
  );
}
