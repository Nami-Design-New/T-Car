"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { BankAccount } from "../model";
import { BankCard } from "@/shared/ui/BankCard";
import { Loader } from "@/shared/ui/Loader";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";

import { ICONS } from "@/shared/config/assets";
import { Button } from "@/shared/ui/Button";
const deleteIcon = ICONS.bankDelete;
const editIcon = ICONS.bankEdit;

interface Props {
  accounts: BankAccount[];
  loading?: boolean;
  /** Set when the accounts failed to load; ErrorState picks the message. */
  error?: unknown;
  onRetry?: () => void;
  onAdd: () => void;
  onEdit: (account: BankAccount) => void;
  onDelete: (account: BankAccount) => void;
}

export default function BankAccountsTab({
  accounts,
  loading = false,
  error,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations("bankAccounts");
  if (loading) {
    return (
      <div className="rounded-xl border border-stroke-light bg-surface-elevated p-6">
        <Loader fullScreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className=" flex flex-col gap-5 rounded-xl border border-stroke-light bg-surface-elevated p-6">
        <h3 className=" m-0 text-base font-semibold leading-5.75 text-text-primary">
          {t("title")}
        </h3>
        <ErrorState error={error} onRetry={onRetry} size="section" />
      </div>
    );
  }

  return (
    <div className=" flex flex-col gap-5 rounded-xl border border-stroke-light bg-surface-elevated p-6">
      <h3 className=" m-0 text-base font-semibold leading-5.75 text-text-primary">
        {t("title")}
      </h3>

      {accounts.length === 0 ? (
        <EmptyState title={t("title")} size="section" />
      ) : (
        <ul className=" m-0 flex list-none flex-col gap-3 p-0">
          {accounts.map((account) => (
            <li key={account.id}>
              <BankCard variant="listed">
                <BankCard.Details>
                  <BankCard.Bank name={account.bankName} logo={account.logo} />
                  <BankCard.Number>{account.maskedNumber}</BankCard.Number>
                </BankCard.Details>
                <BankCard.Actions>
                  <BankCard.Action
                    label={t("edit", { bank: account.bankName })}
                    onClick={() => onEdit(account)}
                  >
                    <Image
                      src={editIcon}
                      className="size-5 max-w-none shrink-0"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </BankCard.Action>
                  <BankCard.Action
                    label={t("delete", { bank: account.bankName })}
                    onClick={() => onDelete(account)}
                  >
                    <Image
                      src={deleteIcon}
                      alt=""
                      className="size-5 max-w-none shrink-0"
                      width={20}
                      height={20}
                    />
                  </BankCard.Action>
                </BankCard.Actions>
              </BankCard>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" className=" w-full" size="lg" onClick={onAdd}>
        {t("add")}
      </Button>
    </div>
  );
}
