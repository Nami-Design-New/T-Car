"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  rewardPoints: number;
}

const TERMS = ["reward", "newUser", "oneCode", "eligibleBooking"] as const;

/** The invite reward rules, read-only. */
export default function ReferralTermsDialog({
  open,
  onClose,
  rewardPoints,
}: Props) {
  const t = useTranslations("account.referrals.termsDialog");

  return (
    <Dialog open={open} onClose={onClose} size="md" placement="bottom-sheet">
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>
        <ul className="text-text-subtle m-0 flex list-disc flex-col gap-3 ps-5 text-sm leading-relaxed">
          {TERMS.map((term) => (
            <li key={term}>{t(`items.${term}`, { points: rewardPoints })}</li>
          ))}
        </ul>
      </Dialog.Body>
      <Dialog.Footer>
        <Button className="max-md:w-full" onClick={onClose}>
          {t("confirm")}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
