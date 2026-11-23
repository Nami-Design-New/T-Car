"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiCopy, FiShare2 } from "react-icons/fi";
import { useNotify } from "@/shared/hooks/useNotify";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import {
  referralInviteUrl,
  referralShareText,
  whatsappShareUrl,
} from "../model";
import { useCopyText } from "../useCopyText";

interface Props {
  open: boolean;
  onClose: () => void;
  code: string;
}

const subscribe = () => () => {};
/** The browser's own share sheet (Web Share API); absent on most desktops. */
const canUseNativeShare = () =>
  typeof navigator !== "undefined" && typeof navigator.share === "function";
const siteOrigin = () => window.location.origin;

/** Share the invite: WhatsApp, copy the message, or the device's share sheet. */
export default function ReferralShareDialog({ open, onClose, code }: Props) {
  const t = useTranslations("account.referrals.shareDialog");
  const notify = useNotify();
  const { copy } = useCopyText();
  const nativeShare = useSyncExternalStore(
    subscribe,
    canUseNativeShare,
    () => false,
  );
  const locale = useLocale();
  // The link needs the browser's origin; the server renders the message without it.
  const origin = useSyncExternalStore(subscribe, siteOrigin, () => null);
  const message = referralShareText(
    t("message"),
    code,
    origin && referralInviteUrl(origin, locale, code),
  );

  const copyMessage = async () => {
    if (await copy(message)) {
      notify.success(t("messageCopied"));
      onClose();
    } else {
      notify.error(t("copyFailed"));
    }
  };

  const shareNatively = async () => {
    try {
      await navigator.share({ text: message });
      onClose();
    } catch {
      // Dismissing the share sheet rejects too; the dialog stays open.
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="sm" placement="bottom-sheet">
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body className="flex flex-col gap-4">
        <p className="text-text-subtle m-0 text-sm">{t("description")}</p>
        <div className="bg-surface-card-primary flex flex-col gap-2 rounded-lg p-4 text-sm">
          <span>{t("message")}</span>
          <strong
            className="text-action-primary text-lg tracking-[0.12em]"
            dir="ltr"
          >
            {code}
          </strong>
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild icon={<FaWhatsapp aria-hidden />}>
            <a
              href={whatsappShareUrl(message)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
            >
              {t("whatsapp")}
            </a>
          </Button>
          <Button
            variant="outline"
            icon={<FiCopy aria-hidden />}
            onClick={copyMessage}
          >
            {t("copyMessage")}
          </Button>
          {nativeShare && (
            <Button
              variant="outline"
              icon={<FiShare2 aria-hidden />}
              onClick={shareNatively}
            >
              {t("moreOptions")}
            </Button>
          )}
        </div>
      </Dialog.Body>
    </Dialog>
  );
}
