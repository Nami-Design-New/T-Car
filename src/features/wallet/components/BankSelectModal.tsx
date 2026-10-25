"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { PiBank } from "react-icons/pi";
import { Dialog } from "@/shared/ui/Dialog";
import type { BankAccount } from "@/features/bank-accounts";

interface Props {
  open: boolean;
  accounts: BankAccount[];
  onClose: () => void;
  onSelect: (account: BankAccount) => void;
}

export default function BankSelectModal({
  open,
  accounts,
  onClose,
  onSelect,
}: Props) {
  const t = useTranslations("wallet.bankSelect");

  return (
    <Dialog open={open} onClose={onClose} placement="center" size="md">
      <Dialog.Header>
        <Dialog.Title>{t("title")}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body>
        {accounts.length === 0 ? (
          <p className="bank_select_empty my-3 text-center text-[13px] text-text-subtle">
            {t("empty")}
          </p>
        ) : (
          <ul className="bank_select_list m-0 flex list-none flex-col gap-2.5 p-0">
            {accounts.map((account) => (
              <li key={account.id}>
                <button
                  type="button"
                  className="bank_select_option flex w-full cursor-pointer flex-col items-start gap-2 rounded-md border border-transparent bg-surface-on-background p-3.5 text-start transition-colors hover:border-action-primary focus-visible:border-action-primary focus-visible:outline-none"
                  onClick={() => onSelect(account)}
                >
                  <span className="bank_select_name flex items-center gap-2 text-[13px] font-bold text-text-primary [&_svg]:text-[22px] [&_svg]:text-status-success [&_img]:object-contain">
                    {account.logo ? (
                      <Image src={account.logo} alt="" width={28} height={28} />
                    ) : (
                      <PiBank aria-hidden="true" />
                    )}
                    {account.bankName}
                  </span>
                  <span
                    className="bank_select_number text-[15px] font-bold tracking-[1px] text-text-primary"
                    dir="ltr"
                  >
                    {account.maskedNumber}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dialog.Body>
    </Dialog>
  );
}
